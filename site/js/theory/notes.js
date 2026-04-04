/**
 * Note and Interval representation for music theory.
 *
 * Notes are pitch classes (0-11) with enharmonic spelling support.
 * Intervals measure the distance between notes with proper quality names.
 */

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NAME_TO_PITCH = {};
SHARP_NAMES.forEach((n, i) => NAME_TO_PITCH[n] = i);
FLAT_NAMES.forEach((n, i) => NAME_TO_PITCH[n] = i);
Object.assign(NAME_TO_PITCH, { 'E#': 5, 'B#': 0, 'Cb': 11, 'Fb': 4 });

const SPELLING = {
    0: ['C', 'C'],   1: ['C#', 'Db'],  2: ['D', 'D'],   3: ['D#', 'Eb'],
    4: ['E', 'E'],   5: ['F', 'F'],    6: ['F#', 'Gb'],  7: ['G', 'G'],
    8: ['G#', 'Ab'], 9: ['A', 'A'],   10: ['A#', 'Bb'], 11: ['B', 'B'],
};

const FLAT_KEYS = new Set([
    'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb',
    'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm',
]);

export const INTERVAL_NAMES = {
    0: 'P1', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
    6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7',
};

export const INTERVAL_LONG_NAMES = {
    0: 'Unison', 1: 'Minor 2nd', 2: 'Major 2nd', 3: 'Minor 3rd',
    4: 'Major 3rd', 5: 'Perfect 4th', 6: 'Tritone', 7: 'Perfect 5th',
    8: 'Minor 6th', 9: 'Major 6th', 10: 'Minor 7th', 11: 'Major 7th',
};

export const DEGREE_LABELS = {
    0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
    6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
};

export const DEGREE_LABELS_SHARP = {
    0: '1', 1: 'b2', 2: '2', 3: '#2', 4: '3', 5: '4',
    6: '#4', 7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7',
};

export class Note {
    constructor(name, octave = null) {
        if (!(name in NAME_TO_PITCH)) {
            throw new Error(`Unknown note name: '${name}'`);
        }
        this.name = name;
        this.pitch = NAME_TO_PITCH[name];
        this.octave = octave;
    }

    static fromPitch(pitch, preferFlat = false) {
        pitch = ((pitch % 12) + 12) % 12;
        const name = SPELLING[pitch][preferFlat ? 1 : 0];
        return new Note(name);
    }

    static fromPitchInKey(pitch, key) {
        return Note.fromPitch(pitch, FLAT_KEYS.has(key));
    }

    enharmonic() {
        const [sharp, flat] = SPELLING[this.pitch];
        const other = this.name === sharp ? flat : sharp;
        return new Note(other, this.octave);
    }

    transpose(semitones) {
        const newPitch = ((this.pitch + semitones) % 12 + 12) % 12;
        const preferFlat = this.name.includes('b');
        return Note.fromPitch(newPitch, preferFlat);
    }

    intervalTo(other) {
        const semitones = ((other.pitch - this.pitch) % 12 + 12) % 12;
        return new Interval(semitones);
    }

    withOctave(octave) {
        return new Note(this.name, octave);
    }

    midi() {
        if (this.octave === null) return null;
        return this.pitch + (this.octave + 1) * 12;
    }

    frequency() {
        const m = this.midi();
        if (m === null) return null;
        return 440.0 * Math.pow(2, (m - 69) / 12);
    }

    toString() {
        return this.octave !== null ? `${this.name}${this.octave}` : this.name;
    }
}

export class Interval {
    constructor(semitones) {
        this.semitones = ((semitones % 12) + 12) % 12;
    }

    static fromName(name) {
        for (const [st, n] of Object.entries(INTERVAL_NAMES)) {
            if (n === name) return new Interval(parseInt(st));
        }
        throw new Error(`Unknown interval name: '${name}'`);
    }

    get name()       { return INTERVAL_NAMES[this.semitones]; }
    get longName()   { return INTERVAL_LONG_NAMES[this.semitones]; }
    get degreeLabel() { return DEGREE_LABELS[this.semitones]; }

    toString() { return this.name; }
}
