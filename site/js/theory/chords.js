/**
 * Chord construction, naming, and identification.
 */

import { Note, DEGREE_LABELS, INTERVAL_NAMES } from './notes.js';

export class ChordType {
    constructor(symbol, intervals, fullName = '') {
        this.symbol = symbol;
        this.intervals = intervals;
        this.fullName = fullName || symbol;
    }
}

export const CHORD_TYPES = {};

function reg(symbol, intervals, fullName = '') {
    CHORD_TYPES[symbol] = new ChordType(symbol, intervals, fullName);
}

// Triads
reg('',     [0, 4, 7],    'Major');
reg('m',    [0, 3, 7],    'Minor');
reg('dim',  [0, 3, 6],    'Diminished');
reg('aug',  [0, 4, 8],    'Augmented');
reg('sus2', [0, 2, 7],    'Suspended 2nd');
reg('sus4', [0, 5, 7],    'Suspended 4th');

// Sixths
reg('6',    [0, 4, 7, 9], 'Major 6th');
reg('m6',   [0, 3, 7, 9], 'Minor 6th');

// Sevenths
reg('7',       [0, 4, 7, 10],  'Dominant 7th');
reg('maj7',    [0, 4, 7, 11],  'Major 7th');
reg('m7',      [0, 3, 7, 10],  'Minor 7th');
reg('m(maj7)', [0, 3, 7, 11],  'Minor Major 7th');
reg('m7b5',    [0, 3, 6, 10],  'Half-Diminished 7th');
reg('dim7',    [0, 3, 6, 9],   'Diminished 7th');
reg('aug7',    [0, 4, 8, 10],  'Augmented 7th');
reg('aug(maj7)', [0, 4, 8, 11], 'Augmented Major 7th');
reg('7sus4',   [0, 5, 7, 10],  'Dominant 7th sus4');

// Ninths
reg('9',    [0, 4, 7, 10, 14], 'Dominant 9th');
reg('maj9', [0, 4, 7, 11, 14], 'Major 9th');
reg('m9',   [0, 3, 7, 10, 14], 'Minor 9th');
reg('add9', [0, 4, 7, 14],     'Add 9');

// Elevenths
reg('11',   [0, 4, 7, 10, 14, 17], 'Dominant 11th');
reg('m11',  [0, 3, 7, 10, 14, 17], 'Minor 11th');

// Thirteenths
reg('13',    [0, 4, 7, 10, 14, 21], 'Dominant 13th');
reg('maj13', [0, 4, 7, 11, 14, 21], 'Major 13th');
reg('m13',   [0, 3, 7, 10, 14, 21], 'Minor 13th');

// Altered dominants
reg('7b9',  [0, 4, 7, 10, 13], 'Dominant 7th flat 9');
reg('7#9',  [0, 4, 7, 10, 15], 'Dominant 7th sharp 9');
reg('7#11', [0, 4, 7, 10, 18], 'Dominant 7th sharp 11');
reg('7b13', [0, 4, 7, 10, 20], 'Dominant 7th flat 13');
reg('7b5',  [0, 4, 6, 10],     'Dominant 7th flat 5');
reg('7#5',  [0, 4, 8, 10],     'Dominant 7th sharp 5');
reg('7alt', [0, 4, 6, 10, 13], 'Altered Dominant');

export class Chord {
    constructor(root, chordType = '') {
        if (typeof root === 'string') root = new Note(root);
        this.root = root;

        if (typeof chordType === 'string') {
            if (!(chordType in CHORD_TYPES)) {
                throw new Error(`Unknown chord type: '${chordType}'`);
            }
            this.chordType = CHORD_TYPES[chordType];
        } else {
            this.chordType = chordType;
        }
    }

    notes() {
        return this.chordType.intervals.map(i => this.root.transpose(i));
    }

    pitchClasses() {
        return new Set(this.chordType.intervals.map(i => ((this.root.pitch + i) % 12 + 12) % 12));
    }

    intervals() {
        return this.chordType.intervals.map(i => ({ semitones: ((i % 12) + 12) % 12, raw: i }));
    }

    formula() {
        return this.chordType.intervals
            .map(i => DEGREE_LABELS[((i % 12) + 12) % 12] || String(i))
            .join(' ');
    }

    get symbol() {
        return `${this.root.name}${this.chordType.symbol}`;
    }

    get fullName() {
        return `${this.root.name} ${this.chordType.fullName}`;
    }
}

export function identifyChord(notes) {
    const pitches = notes.map(n => {
        if (typeof n === 'string') n = new Note(n);
        return n.pitch;
    });

    const results = [];
    for (const rootPitch of pitches) {
        const intervalsFromRoot = [...new Set(pitches.map(p => ((p - rootPitch) % 12 + 12) % 12))].sort((a, b) => a - b);
        for (const [symbol, ct] of Object.entries(CHORD_TYPES)) {
            const ctMod12 = [...new Set(ct.intervals.map(i => ((i % 12) + 12) % 12))].sort((a, b) => a - b);
            if (JSON.stringify(intervalsFromRoot) === JSON.stringify(ctMod12)) {
                const rootNote = Note.fromPitch(rootPitch);
                results.push(`${rootNote.name}${symbol}`);
            }
        }
    }
    return results;
}

export function getChordType(symbol) {
    if (symbol in CHORD_TYPES) return CHORD_TYPES[symbol];
    throw new Error(`Unknown chord type: '${symbol}'`);
}

export function allChordTypeSymbols() {
    return Object.keys(CHORD_TYPES).sort();
}
