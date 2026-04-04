/**
 * Chord progression templates and generation.
 */

import { Note } from './notes.js';
import { diatonicChords } from './harmony.js';

export class ProgressionTemplate {
    constructor(name, degrees, quality = 'major', sevenths = false, description = '', tags = []) {
        this.name = name;
        this.degrees = degrees;
        this.quality = quality;
        this.sevenths = sevenths;
        this.description = description;
        this.tags = tags;
    }
}

export class ProgressionChord {
    constructor(diatonicChord, position) {
        this.diatonicChord = diatonicChord;
        this.position = position;
    }

    get roman()    { return this.diatonicChord.roman; }
    get symbol()   { return this.diatonicChord.chord.symbol; }
    get fullName() { return this.diatonicChord.chord.fullName; }
    get function() { return this.diatonicChord.function; }
    get degree()   { return this.diatonicChord.degree; }

    notes() { return this.diatonicChord.chord.notes(); }

    toDict() {
        const chord = this.diatonicChord.chord;
        const notes = chord.notes();
        return {
            position: this.position,
            degree: this.degree,
            roman: this.roman,
            symbol: this.symbol,
            full_name: this.fullName,
            function: this.function,
            notes: notes.map(n => n.name),
            pitches: notes.map(n => n.pitch),
            formula: chord.formula(),
        };
    }
}

export class Progression {
    constructor(template, keyRoot, chords) {
        this.template = template;
        this.keyRoot = keyRoot;
        this.chords = chords;
    }

    get name()    { return this.template.name; }
    get quality() { return this.template.quality; }

    get keyLabel() {
        const suffix = this.quality === 'minor' ? 'm' : '';
        return `${this.keyRoot.name}${suffix}`;
    }

    romanSequence()  { return this.chords.map(c => c.roman); }
    symbolSequence() { return this.chords.map(c => c.symbol); }

    toDict() {
        return {
            name: this.template.name,
            description: this.template.description,
            tags: this.template.tags,
            key: this.keyLabel,
            quality: this.quality,
            sevenths: this.template.sevenths,
            roman_sequence: this.romanSequence(),
            symbol_sequence: this.symbolSequence(),
            chords: this.chords.map(c => c.toDict()),
        };
    }
}

export function generateProgression(template, keyRoot) {
    if (typeof keyRoot === 'string') keyRoot = new Note(keyRoot);

    const allDiatonic = diatonicChords(keyRoot, template.quality, template.sevenths);
    const byDegree = {};
    for (const dc of allDiatonic) {
        byDegree[dc.degree] = dc;
    }

    const chords = template.degrees.map((deg, i) => {
        if (!(deg in byDegree)) {
            throw new Error(`Degree ${deg} not in diatonic chords for ${keyRoot.name} ${template.quality}`);
        }
        return new ProgressionChord(byDegree[deg], i);
    });

    return new Progression(template, keyRoot, chords);
}

// --- Progression template library ---

export const PROGRESSIONS = {};

function reg(key, name, degrees, quality = 'major', sevenths = false, description = '', tags = []) {
    PROGRESSIONS[key] = new ProgressionTemplate(name, degrees, quality, sevenths, description, tags);
}

// Major key — triads
reg('I_IV_V_I', 'Classic Three-Chord', [1, 4, 5, 1],
    'major', false, 'The foundation of rock, country, and folk.', ['rock', 'country', 'folk']);
reg('I_V_vi_IV', 'Pop Anthem', [1, 5, 6, 4],
    'major', false, 'The most common pop progression. Endless hits.', ['pop', 'rock']);
reg('I_vi_IV_V', 'Doo-Wop / 50s', [1, 6, 4, 5],
    'major', false, 'Classic 1950s progression. Sweet and nostalgic.', ['pop', 'doo-wop', 'oldies']);
reg('I_IV_vi_V', 'Sensitive Singer-Songwriter', [1, 4, 6, 5],
    'major', false, 'Warm and emotionally open.', ['pop', 'singer-songwriter']);
reg('vi_IV_I_V', 'Axis of Awesome', [6, 4, 1, 5],
    'major', false, 'Same four chords, different starting point. Huge sound.', ['pop', 'rock']);
reg('I_IV_I_V', 'Country Standard', [1, 4, 1, 5],
    'major', false, 'Simple and driving. Great for country and folk.', ['country', 'folk']);
reg('I_iii_IV_V', 'Rising Motion', [1, 3, 4, 5],
    'major', false, 'Stepwise bass motion creates lift.', ['pop', 'rock']);
reg('I_V_IV_V', 'Rock Cadence', [1, 5, 4, 5],
    'major', false, 'Strong rock feel with plagal movement.', ['rock']);

// Major key — 7ths
reg('ii_V_I_jazz', 'ii-V-I (Jazz Major)', [2, 5, 1],
    'major', true, 'The most important jazz progression.', ['jazz']);
reg('I_vi_ii_V_jazz', 'Turnaround (Jazz)', [1, 6, 2, 5],
    'major', true, 'Standard jazz turnaround. Cycle of fifths motion.', ['jazz']);
reg('iii_vi_ii_V_jazz', 'Full Cycle (Jazz)', [3, 6, 2, 5],
    'major', true, 'Extended cycle of fifths through the diatonic chords.', ['jazz']);
reg('I_IV_ii_V_jazz', 'Rhythm Changes Bridge', [1, 4, 2, 5],
    'major', true, 'Common jazz bridge pattern.', ['jazz']);

// Minor key — triads
reg('i_iv_v_i', 'Natural Minor', [1, 4, 5, 1],
    'minor', false, 'Dark and modal. The minor v gives a softer cadence.', ['rock', 'metal']);
reg('i_VI_III_VII', 'Andalusian Cadence', [1, 6, 3, 7],
    'minor', false, 'Flamenco and classical. Descending bass line.', ['flamenco', 'classical']);
reg('i_iv_VII_III', 'Minor Pop', [1, 4, 7, 3],
    'minor', false, 'Common in modern minor-key pop and R&B.', ['pop', 'r&b']);
reg('i_VII_VI_VII', 'Epic Minor', [1, 7, 6, 7],
    'minor', false, 'Powerful and anthemic. Great for dramatic builds.', ['rock', 'metal', 'film']);
reg('i_VI_VII_i', 'Minor Plagal', [1, 6, 7, 1],
    'minor', false, 'Simple but effective minor resolution.', ['rock', 'pop']);

// Minor key — 7ths
reg('ii_V_i_jazz_minor', 'ii-V-i (Jazz Minor)', [2, 5, 1],
    'minor', true, 'Minor key jazz cadence. Half-dim to dom7 to min7.', ['jazz']);

// Longer / special
reg('12_bar_blues', '12-Bar Blues', [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
    'major', false, 'The backbone of blues, rock & roll, and R&B.', ['blues', 'rock']);
reg('12_bar_blues_7', '12-Bar Blues (7ths)', [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
    'major', true, '12-bar blues with dominant 7th flavor.', ['blues', 'jazz']);
reg('canon', 'Pachelbel Canon', [1, 5, 6, 3, 4, 1, 4, 5],
    'major', false, 'The famous Canon in D progression. Timeless.', ['classical', 'pop']);
reg('royal_road', 'Royal Road (J-Pop)', [4, 5, 3, 6],
    'major', false, 'IV-V-iii-vi. Hugely popular in Japanese pop music.', ['j-pop', 'pop']);

export function getProgressionTemplate(key) {
    if (key in PROGRESSIONS) return PROGRESSIONS[key];
    throw new Error(`Unknown progression: '${key}'`);
}

export function allProgressionKeys() {
    return Object.keys(PROGRESSIONS);
}

export function progressionsByQuality(quality) {
    return Object.keys(PROGRESSIONS).filter(k => PROGRESSIONS[k].quality === quality);
}

export function progressionsByTag(tag) {
    return Object.keys(PROGRESSIONS).filter(k => PROGRESSIONS[k].tags.includes(tag));
}

export function allTags() {
    const tags = new Set();
    for (const p of Object.values(PROGRESSIONS)) {
        p.tags.forEach(t => tags.add(t));
    }
    return [...tags].sort();
}
