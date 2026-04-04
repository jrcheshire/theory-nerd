/**
 * Fretboard model — maps notes, scales, and chords to string/fret positions.
 */

import { Note, DEGREE_LABELS } from './notes.js';

export class Tuning {
    constructor(name, strings, openMidis) {
        this.name = name;
        this.stringNotes = strings.map(s => new Note(s));
        this.openMidis = openMidis;  // MIDI note number for each open string
    }

    get numStrings() { return this.stringNotes.length; }
}

//                                                     E2  A2  D3  G3  B3  E4
export const TUNINGS = {
    standard:    new Tuning('Standard',   ['E','A','D','G','B','E'],    [40, 45, 50, 55, 59, 64]),
    d_standard:  new Tuning('D Standard', ['D','G','C','F','A','D'],    [38, 43, 48, 53, 57, 62]),
    drop_c:      new Tuning('Drop C',     ['C','G','C','F','A','D'],    [36, 43, 48, 53, 57, 62]),
    c_standard:  new Tuning('C Standard', ['C','F','Bb','Eb','G','C'],  [36, 41, 46, 51, 55, 60]),
    drop_d:      new Tuning('Drop D',     ['D','A','D','G','B','E'],    [38, 45, 50, 55, 59, 64]),
    open_g:      new Tuning('Open G',     ['D','G','D','G','B','D'],    [38, 43, 50, 55, 59, 62]),
    open_d:      new Tuning('Open D',     ['D','A','D','F#','A','D'],   [38, 45, 50, 54, 57, 62]),
    dadgad:      new Tuning('DADGAD',     ['D','A','D','G','A','D'],    [38, 45, 50, 55, 57, 62]),
};

export class Fretboard {
    constructor(tuningKey = 'standard', numFrets = 24) {
        const key = tuningKey.toLowerCase().replace(/ /g, '_');
        if (!(key in TUNINGS)) {
            throw new Error(`Unknown tuning: '${tuningKey}'`);
        }
        this.tuning = TUNINGS[key];
        this.numFrets = numFrets;
    }

    noteAt(string, fret) {
        return this.tuning.stringNotes[string].transpose(fret);
    }

    mapScale(scale, root) {
        if (typeof root === 'string') root = new Note(root);

        const scalePitches = {};
        for (const i of scale.intervals) {
            scalePitches[(root.pitch + i) % 12] = DEGREE_LABELS[i];
        }

        const positions = [];
        for (let s = 0; s < this.tuning.numStrings; s++) {
            for (let f = 0; f <= this.numFrets; f++) {
                const n = this.noteAt(s, f);
                if (n.pitch in scalePitches) {
                    positions.push({
                        string: s, fret: f,
                        note: n.name, label: scalePitches[n.pitch],
                        pitch: n.pitch,
                        midi: this.tuning.openMidis[s] + f,
                    });
                }
            }
        }
        return positions;
    }

    mapChord(chord) {
        const chordPitches = {};
        for (const i of chord.chordType.intervals) {
            const pitch = ((chord.root.pitch + i) % 12 + 12) % 12;
            chordPitches[pitch] = DEGREE_LABELS[((i % 12) + 12) % 12] || String(i);
        }

        const positions = [];
        for (let s = 0; s < this.tuning.numStrings; s++) {
            for (let f = 0; f <= this.numFrets; f++) {
                const n = this.noteAt(s, f);
                if (n.pitch in chordPitches) {
                    positions.push({
                        string: s, fret: f,
                        note: n.name, label: chordPitches[n.pitch],
                        pitch: n.pitch,
                        midi: this.tuning.openMidis[s] + f,
                    });
                }
            }
        }
        return positions;
    }
}

export function allTuningNames() {
    return Object.keys(TUNINGS).sort();
}
