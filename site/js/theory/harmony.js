/**
 * Functional harmony: diatonic chord generation and Roman numeral analysis.
 */

import { Note } from './notes.js';
import { SCALES } from './scales.js';
import { Chord } from './chords.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const MAJOR_TRIAD_TYPES   = ['', 'm', 'm', '', '', 'm', 'dim'];
const MAJOR_SEVENTH_TYPES = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];

const MINOR_TRIAD_TYPES   = ['m', 'dim', '', 'm', 'm', '', ''];
const MINOR_SEVENTH_TYPES = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];

export class DiatonicChord {
    constructor(degree, chord, roman, func) {
        this.degree = degree;
        this.chord = chord;
        this.roman = roman;
        this.function = func;
    }
}

function romanFor(degree, chordTypeSymbol) {
    const base = ROMAN[degree];
    const isMinor = ['m', 'm7', 'm7b5', 'dim', 'dim7'].includes(chordTypeSymbol);
    let numeral = isMinor ? base.toLowerCase() : base;

    if (chordTypeSymbol === 'dim') return numeral + '\u00b0';
    if (chordTypeSymbol === 'aug') return numeral + '+';
    if (chordTypeSymbol === '' || chordTypeSymbol === 'm') return numeral;
    if (chordTypeSymbol === 'm7b5') return numeral + '\u00b07';

    let suffix = chordTypeSymbol;
    if (suffix.startsWith('m') && suffix !== 'maj7') {
        suffix = suffix.slice(1);
    }
    return numeral + suffix;
}

function functionLabel(degree) {
    if (degree === 1 || degree === 3) return 'Tonic';
    if (degree === 2 || degree === 4) return 'Subdominant';
    if (degree === 5 || degree === 7) return 'Dominant';
    if (degree === 6) return 'Tonic';
    return 'Unknown';
}

export function diatonicChords(root, quality = 'major', sevenths = false) {
    if (typeof root === 'string') root = new Note(root);

    let scale, typeList;
    if (quality === 'major') {
        scale = SCALES.major;
        typeList = sevenths ? MAJOR_SEVENTH_TYPES : MAJOR_TRIAD_TYPES;
    } else if (quality === 'minor') {
        scale = SCALES.natural_minor;
        typeList = sevenths ? MINOR_SEVENTH_TYPES : MINOR_TRIAD_TYPES;
    } else {
        throw new Error(`Unsupported key quality: '${quality}'`);
    }

    const scaleNotes = scale.notes(root);
    const chords = [];

    for (let i = 0; i < 7; i++) {
        const chordRoot = scaleNotes[i];
        const ctSymbol = typeList[i];
        const chord = new Chord(chordRoot, ctSymbol);
        const roman = romanFor(i, ctSymbol);
        const func = functionLabel(i + 1);
        chords.push(new DiatonicChord(i + 1, chord, roman, func));
    }

    return chords;
}

export function analyzeChordInKey(chord, keyRoot, keyQuality = 'major') {
    const diatonic = diatonicChords(keyRoot, keyQuality,
        chord.chordType.intervals.length > 3);
    for (const dc of diatonic) {
        if (dc.chord.root.pitch === chord.root.pitch &&
            dc.chord.chordType.symbol === chord.chordType.symbol) {
            return dc.roman;
        }
    }
    return null;
}
