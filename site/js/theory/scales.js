/**
 * Scale and mode definitions.
 */

import { Note, DEGREE_LABELS } from './notes.js';

export class Scale {
    constructor(name, intervals, modeNames = null) {
        this.name = name;
        this.intervals = intervals;
        this.modeNames = modeNames;
    }

    notes(root) {
        if (typeof root === 'string') root = new Note(root);
        return this.intervals.map(i => root.transpose(i));
    }

    degree(n, root) {
        if (typeof root === 'string') root = new Note(root);
        const idx = ((n - 1) % this.intervals.length + this.intervals.length) % this.intervals.length;
        return root.transpose(this.intervals[idx]);
    }

    formula() {
        return this.intervals.map(i => DEGREE_LABELS[i] || String(i)).join(' ');
    }

    containsPitch(pitch) {
        return this.intervals.includes(((pitch % 12) + 12) % 12);
    }

    mode(degree) {
        const idx = degree - 1;
        const rotated = [...this.intervals.slice(idx), ...this.intervals.slice(0, idx)];
        const offset = rotated[0];
        const newIntervals = rotated.map(i => ((i - offset) % 12 + 12) % 12);

        let name;
        if (this.modeNames && idx >= 0 && idx < this.modeNames.length) {
            name = this.modeNames[idx];
        } else {
            name = `${this.name} mode ${degree}`;
        }
        return new Scale(name, newIntervals);
    }

    allModes() {
        return this.intervals.map((_, i) => this.mode(i + 1));
    }
}

// --- Built-in scale library ---

const MAJOR_MODE_NAMES = [
    'Ionian', 'Dorian', 'Phrygian', 'Lydian',
    'Mixolydian', 'Aeolian', 'Locrian',
];

const MELODIC_MINOR_MODE_NAMES = [
    'Melodic Minor', 'Dorian b2', 'Lydian Augmented',
    'Lydian Dominant', 'Mixolydian b6', 'Locrian #2', 'Altered',
];

export const SCALES = {
    major:           new Scale('Major', [0, 2, 4, 5, 7, 9, 11], MAJOR_MODE_NAMES),
    ionian:          new Scale('Ionian', [0, 2, 4, 5, 7, 9, 11], MAJOR_MODE_NAMES),
    natural_minor:   new Scale('Natural Minor', [0, 2, 3, 5, 7, 8, 10]),
    aeolian:         new Scale('Aeolian', [0, 2, 3, 5, 7, 8, 10]),
    harmonic_minor:  new Scale('Harmonic Minor', [0, 2, 3, 5, 7, 8, 11]),
    melodic_minor:   new Scale('Melodic Minor', [0, 2, 3, 5, 7, 9, 11], MELODIC_MINOR_MODE_NAMES),
    pentatonic_major: new Scale('Major Pentatonic', [0, 2, 4, 7, 9]),
    pentatonic_minor: new Scale('Minor Pentatonic', [0, 3, 5, 7, 10]),
    blues:           new Scale('Blues', [0, 3, 5, 6, 7, 10]),
    whole_tone:      new Scale('Whole Tone', [0, 2, 4, 6, 8, 10]),
    diminished_hw:   new Scale('Diminished (H-W)', [0, 1, 3, 4, 6, 7, 9, 10]),
    diminished_wh:   new Scale('Diminished (W-H)', [0, 2, 3, 5, 6, 8, 9, 11]),
    chromatic:       new Scale('Chromatic', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
};

// Generate individual modes as top-level entries
const major = SCALES.major;
MAJOR_MODE_NAMES.forEach((modeName, i) => {
    const key = modeName.toLowerCase();
    if (!(key in SCALES)) {
        SCALES[key] = major.mode(i + 1);
    }
});

const melMinor = SCALES.melodic_minor;
MELODIC_MINOR_MODE_NAMES.forEach((modeName, i) => {
    const key = modeName.toLowerCase().replace(/ /g, '_');
    if (!(key in SCALES)) {
        SCALES[key] = melMinor.mode(i + 1);
    }
});

export function getScale(name) {
    const key = name.toLowerCase().replace(/ /g, '_');
    if (key in SCALES) return SCALES[key];
    throw new Error(`Unknown scale: '${name}'. Available: ${Object.keys(SCALES).sort().join(', ')}`);
}

export function allScaleNames() {
    return Object.keys(SCALES).sort();
}
