/**
 * Theory Nerd — Static SPA
 *
 * Single entry point: hash-based routing, populates selects from theory modules,
 * and wires up all four page controllers.
 */

import { Note, SHARP_NAMES, INTERVAL_NAMES, INTERVAL_LONG_NAMES, DEGREE_LABELS } from './theory/notes.js';
import { SCALES, getScale, allScaleNames } from './theory/scales.js';
import { CHORD_TYPES, Chord, allChordTypeSymbols } from './theory/chords.js';
import { TUNINGS, Fretboard } from './theory/fretboard.js';
import { PROGRESSIONS, allProgressionKeys, allTags, getProgressionTemplate, generateProgression } from './theory/progressions.js';
import * as Audio from './audio.js';

// ========== ROUTER ==========

function navigate() {
    const hash = location.hash.slice(1) || 'fretboard';
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const page = document.getElementById(`page-${hash}`);
    if (page) page.style.display = '';

    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === hash);
    });
}

// ========== POPULATE SELECTS ==========

function populateNoteSelect(id, defaultNote = 'C') {
    const sel = document.getElementById(id);
    for (const name of SHARP_NAMES) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === defaultNote) opt.selected = true;
        sel.appendChild(opt);
    }
}

function populateTunings() {
    const sel = document.getElementById('tuning-select');
    for (const [key, tuning] of Object.entries(TUNINGS)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${tuning.name} (${tuning.stringNotes.map(n => n.name).join(' ')})`;
        if (key === 'd_standard') opt.selected = true;
        sel.appendChild(opt);
    }
}

function populateScaleOptions() {
    const sel = document.getElementById('type-select');
    sel.innerHTML = '';
    for (const name of allScaleNames()) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        sel.appendChild(opt);
    }
}

function populateChordOptions() {
    const sel = document.getElementById('type-select');
    sel.innerHTML = '';
    for (const sym of allChordTypeSymbols()) {
        const opt = document.createElement('option');
        opt.value = sym;
        opt.textContent = sym || 'Major';
        sel.appendChild(opt);
    }
}

function populateProgressions(filterTag = '') {
    const sel = document.getElementById('progression-select');
    const currentValue = sel.value;
    sel.innerHTML = '';
    for (const key of allProgressionKeys()) {
        const tmpl = PROGRESSIONS[key];
        if (filterTag && !tmpl.tags.includes(filterTag)) continue;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = tmpl.name;
        sel.appendChild(opt);
    }
    if ([...sel.options].some(o => o.value === currentValue)) {
        sel.value = currentValue;
    }
}

function populateTags() {
    const sel = document.getElementById('tag-filter');
    for (const tag of allTags()) {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
        sel.appendChild(opt);
    }
}

// ========== FRETBOARD PAGE ==========

const FB = (() => {
    const PADDING_LEFT = 60, PADDING_TOP = 40, PADDING_RIGHT = 20, PADDING_BOTTOM = 30;
    const STRING_SPACING = 30, FRET_SPACING = 52, DOT_RADIUS = 12, NUT_WIDTH = 6;
    const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
    const DOUBLE_DOTS = [12, 24];

    const DEGREE_COLORS = {
        '1': '#e94560', 'b2': '#f5a623', '2': '#f5a623',
        'b3': '#4ecdc4', '3': '#4ecdc4', '4': '#a8d8ea',
        'b5': '#7c4dff', '5': '#45b7d1', 'b6': '#c792ea',
        '6': '#c792ea', 'b7': '#f78c6c', '7': '#f78c6c',
    };

    let currentData = null;

    function svgEl(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    }

    function fretX(fret) {
        return fret === 0 ? PADDING_LEFT : PADDING_LEFT + NUT_WIDTH + (fret - 0.5) * FRET_SPACING;
    }

    function fretLineX(fret) {
        return fret === 0 ? PADDING_LEFT + NUT_WIDTH : PADDING_LEFT + NUT_WIDTH + fret * FRET_SPACING;
    }

    function stringY(stringIndex, numStrings) {
        return PADDING_TOP + (numStrings - 1 - stringIndex) * STRING_SPACING;
    }

    function render(positions, tuning, numFrets) {
        const numStrings = tuning.numStrings;
        const svg = document.getElementById('fretboard');
        svg.innerHTML = '';

        const displayMode = document.getElementById('display-select').value;
        const width = PADDING_LEFT + NUT_WIDTH + numFrets * FRET_SPACING + PADDING_RIGHT;
        const height = PADDING_TOP + (numStrings - 1) * STRING_SPACING + PADDING_BOTTOM;

        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const fbX = PADDING_LEFT;
        const fbY = stringY(numStrings - 1, numStrings);
        const fbH = (numStrings - 1) * STRING_SPACING;

        svg.appendChild(svgEl('rect', { x: fbX, y: fbY, width: NUT_WIDTH + numFrets * FRET_SPACING, height: fbH, fill: '#2a1810', rx: 2 }));
        svg.appendChild(svgEl('rect', { x: PADDING_LEFT, y: fbY, width: NUT_WIDTH, height: fbH, fill: '#ddd', rx: 1 }));

        const markerY = PADDING_TOP + (numStrings - 1) * STRING_SPACING / 2;
        for (const fret of SINGLE_DOTS) {
            if (fret <= numFrets) {
                svg.appendChild(svgEl('circle', { cx: PADDING_LEFT + NUT_WIDTH + (fret - 0.5) * FRET_SPACING, cy: markerY, r: 4, fill: '#444' }));
            }
        }
        for (const fret of DOUBLE_DOTS) {
            if (fret <= numFrets) {
                const cx = PADDING_LEFT + NUT_WIDTH + (fret - 0.5) * FRET_SPACING;
                const offset = STRING_SPACING * 1.2;
                svg.appendChild(svgEl('circle', { cx, cy: markerY - offset, r: 4, fill: '#444' }));
                svg.appendChild(svgEl('circle', { cx, cy: markerY + offset, r: 4, fill: '#444' }));
            }
        }

        for (let f = 1; f <= numFrets; f++) {
            const x = fretLineX(f);
            svg.appendChild(svgEl('line', { x1: x, y1: fbY, x2: x, y2: fbY + fbH, stroke: '#555', 'stroke-width': f % 12 === 0 ? 2 : 1 }));
        }

        for (let f = 1; f <= numFrets; f++) {
            if (SINGLE_DOTS.includes(f) || DOUBLE_DOTS.includes(f)) {
                const text = svgEl('text', { x: PADDING_LEFT + NUT_WIDTH + (f - 0.5) * FRET_SPACING, y: height - 5, 'text-anchor': 'middle', fill: '#666', 'font-size': '11' });
                text.textContent = f;
                svg.appendChild(text);
            }
        }

        for (let s = 0; s < numStrings; s++) {
            const y = stringY(s, numStrings);
            svg.appendChild(svgEl('line', { x1: PADDING_LEFT, y1: y, x2: PADDING_LEFT + NUT_WIDTH + numFrets * FRET_SPACING, y2: y, stroke: '#bbb', 'stroke-width': 1 + (numStrings - 1 - s) * 0.3 }));
            const label = svgEl('text', { x: PADDING_LEFT - 10, y: y + 4, 'text-anchor': 'end', fill: '#999', 'font-size': '13', 'font-weight': 'bold' });
            label.textContent = tuning.stringNotes[s].name;
            svg.appendChild(label);
        }

        for (const p of positions) {
            const cx = fretX(p.fret);
            const cy = stringY(p.string, numStrings);
            const color = DEGREE_COLORS[p.label] || '#888';
            const isRoot = p.label === '1';

            const circle = svgEl('circle', { cx, cy, r: DOT_RADIUS, fill: color, stroke: isRoot ? '#fff' : 'none', 'stroke-width': isRoot ? 2 : 0, cursor: 'pointer', opacity: 0.9 });
            circle.addEventListener('click', () => {
                const baseOctaves = [2, 2, 3, 3, 3, 4];
                Audio.playNote(p.pitch, (baseOctaves[p.string] || 2) + Math.floor(p.fret / 12), 0.6);
            });
            svg.appendChild(circle);

            let labelText = p.label;
            if (displayMode === 'note') labelText = p.note;
            else if (displayMode === 'interval') labelText = INTERVAL_NAMES[p.pitch] || p.label;

            const text = svgEl('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', fill: isRoot ? '#fff' : '#111', 'font-size': labelText.length > 2 ? '9' : '11', 'font-weight': isRoot ? 'bold' : 'normal', 'pointer-events': 'none' });
            text.textContent = labelText;
            svg.appendChild(text);
        }
    }

    function update() {
        const tuningKey = document.getElementById('tuning-select').value;
        const root = document.getElementById('root-select').value;
        const mode = document.getElementById('mode-select').value;
        const typeName = document.getElementById('type-select').value;
        const numFrets = 24;

        const fb = new Fretboard(tuningKey, numFrets);
        let positions, info;

        if (mode === 'scale') {
            const scale = getScale(typeName);
            positions = fb.mapScale(scale, root);
            const notes = scale.notes(new Note(root));
            info = { name: scale.name, formula: scale.formula(), notes: notes.map(n => n.name).join(' ') };
        } else {
            const chord = new Chord(root, typeName);
            positions = fb.mapChord(chord);
            const notes = chord.notes();
            info = { name: chord.symbol, formula: chord.formula(), notes: notes.map(n => n.name).join(' ') };
        }

        currentData = { positions, tuning: fb.tuning, numFrets };
        render(positions, fb.tuning, numFrets);

        const bar = document.getElementById('info-bar');
        bar.innerHTML = '';
        for (const [label, value] of [['Name', info.name], ['Formula', info.formula], ['Notes', info.notes]]) {
            if (!value) continue;
            const div = document.createElement('div');
            div.className = 'info-item';
            div.innerHTML = `<span class="info-label">${label}:</span> <span>${value}</span>`;
            bar.appendChild(div);
        }
    }

    function rerender() {
        if (currentData) render(currentData.positions, currentData.tuning, currentData.numFrets);
    }

    function init() {
        populateTunings();
        populateNoteSelect('root-select');
        populateScaleOptions();

        document.getElementById('tuning-select').addEventListener('change', update);
        document.getElementById('root-select').addEventListener('change', update);
        document.getElementById('mode-select').addEventListener('change', () => {
            const mode = document.getElementById('mode-select').value;
            if (mode === 'scale') populateScaleOptions();
            else populateChordOptions();
            update();
        });
        document.getElementById('type-select').addEventListener('change', update);
        document.getElementById('display-select').addEventListener('change', rerender);
        document.getElementById('volume-slider').addEventListener('input', e => Audio.setVolume(e.target.value / 100));

        update();
    }

    return { init };
})();

// ========== REFERENCE PAGE ==========

const REF = (() => {
    const DEGREE_COLORS = {
        '1': '#e94560', 'b2': '#f5a623', '2': '#f5a623',
        'b3': '#4ecdc4', '3': '#4ecdc4', '4': '#a8d8ea',
        'b5': '#7c4dff', '5': '#45b7d1', 'b6': '#c792ea',
        '6': '#c792ea', 'b7': '#f78c6c', '7': '#f78c6c',
    };

    let currentTab = 'scales';
    let searchTimer = null;

    function getRoot() { return document.getElementById('ref-root-select').value; }
    function getSearch() { return document.getElementById('ref-search').value.toLowerCase(); }

    function renderScaleList() {
        const root = new Note(getRoot());
        const search = getSearch();
        const list = document.getElementById('ref-list');
        list.innerHTML = '';

        for (const key of allScaleNames()) {
            const scale = SCALES[key];
            if (search && !scale.name.toLowerCase().includes(search) && !key.includes(search)) continue;

            const notes = scale.notes(root);
            const item = document.createElement('div');
            item.className = 'ref-list-item';
            item.innerHTML = `<div class="ref-item-name">${scale.name}</div><div class="ref-item-meta">${notes.map(n => n.name).join(' ')} <span class="ref-note-count">${scale.intervals.length} notes</span></div>`;
            item.addEventListener('click', () => {
                list.querySelectorAll('.ref-list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                showScaleDetail(key);
            });
            list.appendChild(item);
        }
        if (!list.children.length) list.innerHTML = '<div class="ref-empty">No scales found</div>';
    }

    function renderChordList() {
        const root = new Note(getRoot());
        const search = getSearch();
        const list = document.getElementById('ref-list');
        list.innerHTML = '';

        for (const symbol of allChordTypeSymbols()) {
            const ct = CHORD_TYPES[symbol];
            if (search && !ct.fullName.toLowerCase().includes(search) && !symbol.toLowerCase().includes(search)) continue;

            const chord = new Chord(root, symbol);
            const notes = chord.notes();
            const item = document.createElement('div');
            item.className = 'ref-list-item';
            item.innerHTML = `<div class="ref-item-name">${chord.symbol}</div><div class="ref-item-meta">${notes.map(n => n.name).join(' ')} <span class="ref-note-count">${ct.fullName}</span></div>`;
            item.addEventListener('click', () => {
                list.querySelectorAll('.ref-list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                showChordDetail(symbol);
            });
            list.appendChild(item);
        }
        if (!list.children.length) list.innerHTML = '<div class="ref-empty">No chords found</div>';
    }

    function showScaleDetail(scaleKey) {
        const root = new Note(getRoot());
        const scale = getScale(scaleKey);
        const notes = scale.notes(root);
        const degreeLabels = scale.intervals.map(i => DEGREE_LABELS[i] || String(i));
        const intervalNames = scale.intervals.map(i => INTERVAL_NAMES[i] || String(i));

        const badges = degreeLabels.map((label, i) => {
            const color = DEGREE_COLORS[label] || '#888';
            return `<div class="interval-badge" style="background:${color}"><span class="badge-degree">${label}</span><span class="badge-note">${notes[i].name}</span><span class="badge-interval">${intervalNames[i]}</span></div>`;
        }).join('');

        const detail = document.getElementById('ref-detail');
        detail.innerHTML = `
            <div class="detail-header"><h2>${scale.name}</h2><span class="detail-key">in ${root.name}</span></div>
            <div class="detail-formula"><span class="detail-label">Formula:</span> ${scale.formula()}</div>
            <div class="detail-notes"><span class="detail-label">Notes:</span> ${notes.map(n => n.name).join(' — ')}</div>
            <div class="interval-badges">${badges}</div>
            <div class="detail-actions"><button class="play-btn" id="ref-play-asc">Play Ascending</button><button class="play-btn" id="ref-play-desc">Play Descending</button></div>`;

        const pitches = notes.map(n => n.pitch);
        document.getElementById('ref-play-asc').addEventListener('click', () => playSeq(pitches, false));
        document.getElementById('ref-play-desc').addEventListener('click', () => playSeq(pitches, true));
    }

    function showChordDetail(symbol) {
        const root = new Note(getRoot());
        const chord = new Chord(root, symbol);
        const ct = chord.chordType;
        const notes = chord.notes();
        const degreeLabels = ct.intervals.map(i => DEGREE_LABELS[((i % 12) + 12) % 12] || String(i));
        const intervalNames = ct.intervals.map(i => INTERVAL_NAMES[((i % 12) + 12) % 12] || String(i));

        const badges = degreeLabels.map((label, i) => {
            const color = DEGREE_COLORS[label] || '#888';
            return `<div class="interval-badge" style="background:${color}"><span class="badge-degree">${label}</span><span class="badge-note">${notes[i].name}</span><span class="badge-interval">${intervalNames[i]}</span></div>`;
        }).join('');

        const detail = document.getElementById('ref-detail');
        detail.innerHTML = `
            <div class="detail-header"><h2>${chord.symbol}</h2><span class="detail-key">${chord.fullName}</span></div>
            <div class="detail-formula"><span class="detail-label">Formula:</span> ${chord.formula()}</div>
            <div class="detail-notes"><span class="detail-label">Notes:</span> ${notes.map(n => n.name).join(' — ')}</div>
            <div class="interval-badges">${badges}</div>
            <div class="detail-actions"><button class="play-btn" id="ref-play-chord">Play Chord</button><button class="play-btn" id="ref-play-arp">Play Arpeggio</button></div>`;

        const pitches = notes.map(n => n.pitch);
        document.getElementById('ref-play-chord').addEventListener('click', () => playChordStrum(pitches));
        document.getElementById('ref-play-arp').addEventListener('click', () => playSeq(pitches, false));
    }

    function playSeq(pitches, desc) {
        const ordered = desc ? [...pitches].reverse() : pitches;
        ordered.forEach((p, i) => setTimeout(() => Audio.playNote(p, 4, 0.4), i * 250));
    }

    function playChordStrum(pitches) {
        const midis = [];
        for (let i = 0; i < pitches.length; i++) {
            let midi = pitches[i] + 4 * 12;
            if (i > 0) while (midi <= midis[i - 1]) midi += 12;
            midis.push(midi);
        }
        Audio.playChord(midis, 1.2);
    }

    function refreshList() {
        if (currentTab === 'scales') renderScaleList();
        else renderChordList();
        document.getElementById('ref-detail').innerHTML = '<div class="ref-detail-placeholder">Select a scale or chord to see details</div>';
    }

    function init() {
        populateNoteSelect('ref-root-select');

        document.querySelectorAll('.ref-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ref-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                document.getElementById('ref-search').value = '';
                refreshList();
            });
        });

        document.getElementById('ref-root-select').addEventListener('change', refreshList);
        document.getElementById('ref-search').addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                if (currentTab === 'scales') renderScaleList();
                else renderChordList();
            }, 200);
        });
        document.getElementById('volume-slider-ref').addEventListener('input', e => Audio.setVolume(e.target.value / 100));

        renderScaleList();
    }

    return { init };
})();

// ========== PROGRESSIONS PAGE ==========

const PROG = (() => {
    const FUNCTION_COLORS = { 'Tonic': '#e94560', 'Subdominant': '#4ecdc4', 'Dominant': '#45b7d1' };

    let currentData = null;
    let playbackTimer = null;
    let playbackIndex = -1;

    function playChordAudio(chord) {
        const midis = [];
        for (let i = 0; i < chord.pitches.length; i++) {
            let midi = chord.pitches[i] + 4 * 12;
            if (i > 0) while (midi <= midis[i - 1]) midi += 12;
            midis.push(midi);
        }
        Audio.playChord(midis, 1.0);
    }

    function highlightCard(index) {
        document.querySelectorAll('.chord-card').forEach((c, i) => c.classList.toggle('active', i === index));
    }

    function clearHighlight() {
        document.querySelectorAll('.chord-card').forEach(c => c.classList.remove('active'));
    }

    function renderChords(data) {
        currentData = data;
        const container = document.getElementById('chord-cards');
        container.innerHTML = '';

        data.chords.forEach((chord, i) => {
            const card = document.createElement('div');
            card.className = 'chord-card';
            const funcColor = FUNCTION_COLORS[chord.function] || '#888';
            card.innerHTML = `<div class="chord-roman" style="color:${funcColor}">${chord.roman}</div><div class="chord-symbol">${chord.symbol}</div><div class="chord-notes">${chord.notes.join(' ')}</div><div class="chord-function" style="color:${funcColor}">${chord.function}</div>`;
            card.addEventListener('click', () => { playChordAudio(chord); highlightCard(i); });
            container.appendChild(card);
        });

        const infoBar = document.getElementById('key-info-bar');
        infoBar.innerHTML = '';
        for (const [label, value] of [['Key', data.key], ['Numerals', data.roman_sequence.join('  ')], ['Chords', data.symbol_sequence.join('  ')]]) {
            const div = document.createElement('div');
            div.className = 'info-item';
            div.innerHTML = `<span class="info-label">${label}:</span> <span>${value}</span>`;
            infoBar.appendChild(div);
        }

        const descEl = document.getElementById('prog-description');
        descEl.textContent = data.description || '';
        descEl.style.display = data.description ? '' : 'none';
    }

    function update() {
        const root = document.getElementById('key-root-select').value;
        const progKey = document.getElementById('progression-select').value;
        if (!progKey) return;

        const template = getProgressionTemplate(progKey);
        const prog = generateProgression(template, root);
        renderChords(prog.toDict());
    }

    function startPlayback() {
        if (!currentData || !currentData.chords.length) return;
        stopPlayback();
        playbackIndex = 0;
        playStep();
    }

    function playStep() {
        if (!currentData || playbackIndex >= currentData.chords.length) { stopPlayback(); return; }
        playChordAudio(currentData.chords[playbackIndex]);
        highlightCard(playbackIndex);
        playbackIndex++;
        const bpm = parseInt(document.getElementById('tempo-slider').value, 10);
        playbackTimer = setTimeout(playStep, 60000 / bpm);
    }

    function stopPlayback() {
        if (playbackTimer) { clearTimeout(playbackTimer); playbackTimer = null; }
        playbackIndex = -1;
        clearHighlight();
    }

    function init() {
        populateNoteSelect('key-root-select');
        populateProgressions();
        populateTags();

        document.getElementById('key-root-select').addEventListener('change', update);
        document.getElementById('progression-select').addEventListener('change', update);
        document.getElementById('tag-filter').addEventListener('change', () => {
            populateProgressions(document.getElementById('tag-filter').value);
            update();
        });
        document.getElementById('tempo-slider').addEventListener('input', e => {
            document.getElementById('tempo-display').textContent = `${e.target.value} bpm`;
        });
        document.getElementById('volume-slider-prog').addEventListener('input', e => Audio.setVolume(e.target.value / 100));
        document.getElementById('play-btn').addEventListener('click', startPlayback);
        document.getElementById('stop-btn').addEventListener('click', stopPlayback);

        update();
    }

    return { init };
})();

// ========== EAR TRAINING PAGE ==========

const ET = (() => {
    const EASY_INTERVALS  = [0, 3, 4, 5, 7];
    const MEDIUM_INTERVALS = [0, 1, 2, 3, 4, 5, 7];
    const HARD_INTERVALS  = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    const EASY_CHORDS   = ['', 'm'];
    const MEDIUM_CHORDS = ['', 'm', 'dim', 'aug', '7', 'maj7', 'm7'];
    const HARD_CHORDS   = ['', 'm', 'dim', 'aug', 'sus2', 'sus4', '7', 'maj7', 'm7', 'm7b5', 'dim7', '9', 'm9'];

    const EASY_SCALES   = ['major', 'natural_minor', 'pentatonic_major', 'pentatonic_minor'];
    const MEDIUM_SCALES = ['major', 'natural_minor', 'harmonic_minor', 'pentatonic_major', 'pentatonic_minor', 'blues', 'dorian', 'mixolydian'];
    const HARD_SCALES   = ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'pentatonic_major', 'pentatonic_minor', 'blues', 'whole_tone', 'diminished_hw'];

    let currentQuestion = null;
    let answered = false;
    let score = { correct: 0, total: 0, streak: 0, bestStreak: 0 };

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function generateQuestion() {
        const mode = document.getElementById('et-mode').value;
        const difficulty = document.getElementById('et-difficulty').value;
        const rootPitch = Math.floor(Math.random() * 12);
        const root = Note.fromPitch(rootPitch);

        if (mode === 'interval') return intervalQuestion(root, difficulty);
        if (mode === 'chord') return chordQuestion(root, difficulty);
        return scaleQuestion(root, difficulty);
    }

    function intervalQuestion(root, difficulty) {
        const pool = difficulty === 'easy' ? EASY_INTERVALS : difficulty === 'medium' ? MEDIUM_INTERVALS : HARD_INTERVALS;
        const answerSt = pick(pool);
        const second = root.transpose(answerSt);

        return {
            mode: 'interval',
            play: { type: 'interval', pitches: [root.pitch, second.pitch], rootOctave: 4 },
            answer: answerSt,
            answerLabel: INTERVAL_LONG_NAMES[answerSt],
            choices: pool.map(st => ({ value: st, label: INTERVAL_LONG_NAMES[st] })),
        };
    }

    function chordQuestion(root, difficulty) {
        const pool = difficulty === 'easy' ? EASY_CHORDS : difficulty === 'medium' ? MEDIUM_CHORDS : HARD_CHORDS;
        const answerSym = pick(pool);
        const chord = new Chord(root, answerSym);
        const notes = chord.notes();

        return {
            mode: 'chord',
            play: { type: 'chord', pitches: notes.map(n => n.pitch), rootOctave: 3 },
            answer: answerSym,
            answerLabel: chord.fullName,
            choices: pool.map(sym => ({ value: sym, label: CHORD_TYPES[sym].fullName })),
        };
    }

    function scaleQuestion(root, difficulty) {
        const pool = difficulty === 'easy' ? EASY_SCALES : difficulty === 'medium' ? MEDIUM_SCALES : HARD_SCALES;
        const answerKey = pick(pool);
        const scale = SCALES[answerKey];
        const notes = scale.notes(root);

        return {
            mode: 'scale',
            play: { type: 'scale', pitches: notes.map(n => n.pitch), rootOctave: 4 },
            answer: answerKey,
            answerLabel: scale.name,
            choices: pool.map(key => ({ value: key, label: SCALES[key].name })),
        };
    }

    function playQuestion() {
        if (!currentQuestion) return;
        const p = currentQuestion.play;
        if (p.type === 'interval') {
            Audio.playNote(p.pitches[0], p.rootOctave, 0.5);
            setTimeout(() => Audio.playNote(p.pitches[1], p.rootOctave, 0.5), 600);
        } else if (p.type === 'chord') {
            const midis = [];
            for (let i = 0; i < p.pitches.length; i++) {
                let midi = p.pitches[i] + (p.rootOctave + 1) * 12;
                if (i > 0) while (midi <= midis[i - 1]) midi += 12;
                midis.push(midi);
            }
            Audio.playChord(midis, 1.2);
        } else {
            p.pitches.forEach((pitch, i) => setTimeout(() => Audio.playNote(pitch, p.rootOctave, 0.35), i * 280));
        }
    }

    function renderChoices() {
        const container = document.getElementById('et-choices');
        container.innerHTML = '';
        for (const choice of currentQuestion.choices) {
            const btn = document.createElement('button');
            btn.className = 'et-choice-btn';
            btn.dataset.value = String(choice.value);
            btn.textContent = choice.label;
            btn.addEventListener('click', () => handleAnswer(choice.value, btn));
            container.appendChild(btn);
        }
    }

    function handleAnswer(value, btn) {
        if (answered) return;
        answered = true;
        const isCorrect = String(value) === String(currentQuestion.answer);
        score.total++;

        if (isCorrect) {
            score.correct++;
            score.streak++;
            if (score.streak > score.bestStreak) score.bestStreak = score.streak;
            btn.classList.add('correct');
        } else {
            score.streak = 0;
            btn.classList.add('incorrect');
            document.querySelectorAll('.et-choice-btn').forEach(b => {
                if (b.dataset.value === String(currentQuestion.answer)) b.classList.add('correct');
            });
        }

        document.querySelectorAll('.et-choice-btn').forEach(b => b.disabled = true);

        const feedback = document.getElementById('et-feedback');
        feedback.className = isCorrect ? 'et-feedback correct' : 'et-feedback incorrect';
        feedback.textContent = isCorrect ? 'Correct!' : currentQuestion.answerLabel;

        updateScore();
    }

    function updateScore() {
        document.getElementById('et-score').textContent = `${score.correct} / ${score.total}`;
        const pctEl = document.getElementById('et-pct');
        pctEl.textContent = score.total > 0 ? `${Math.round((score.correct / score.total) * 100)}%` : '';
        const streakEl = document.getElementById('et-streak');
        if (score.streak >= 2) streakEl.textContent = `Streak: ${score.streak}`;
        else if (score.bestStreak >= 3) streakEl.textContent = `Best: ${score.bestStreak}`;
        else streakEl.textContent = '';
    }

    function resetScore() {
        score = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
        updateScore();
        document.getElementById('et-feedback').className = 'et-feedback';
        document.getElementById('et-feedback').textContent = '';
        document.getElementById('et-choices').innerHTML = '';
        document.getElementById('et-prompt').textContent = 'Press Next to start a new question.';
        currentQuestion = null;
        answered = false;
    }

    function nextQuestion() {
        currentQuestion = generateQuestion();
        answered = false;

        const modeLabels = { interval: 'interval', chord: 'chord type', scale: 'scale' };
        document.getElementById('et-prompt').textContent = `Listen and identify the ${modeLabels[currentQuestion.mode]}.`;
        document.getElementById('et-feedback').className = 'et-feedback';
        document.getElementById('et-feedback').textContent = '';
        document.getElementById('et-replay').disabled = false;

        renderChoices();
        setTimeout(playQuestion, 300);
    }

    function init() {
        document.getElementById('et-play').addEventListener('click', nextQuestion);
        document.getElementById('et-replay').addEventListener('click', playQuestion);
        document.getElementById('et-next').addEventListener('click', nextQuestion);
        document.getElementById('et-reset').addEventListener('click', resetScore);
        document.getElementById('et-mode').addEventListener('change', resetScore);
        document.getElementById('et-difficulty').addEventListener('change', resetScore);
        document.getElementById('volume-slider-et').addEventListener('input', e => Audio.setVolume(e.target.value / 100));
    }

    return { init };
})();

// ========== BOOT ==========

document.addEventListener('DOMContentLoaded', () => {
    FB.init();
    REF.init();
    PROG.init();
    ET.init();

    window.addEventListener('hashchange', navigate);
    navigate();
});
