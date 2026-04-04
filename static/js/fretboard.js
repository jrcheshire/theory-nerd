/**
 * SVG Fretboard Renderer
 *
 * Fetches fretboard data from the API and renders an interactive SVG fretboard.
 */

const FretboardApp = (() => {
    // Layout constants
    const PADDING_LEFT = 60;
    const PADDING_TOP = 40;
    const PADDING_RIGHT = 20;
    const PADDING_BOTTOM = 30;
    const STRING_SPACING = 30;
    const FRET_SPACING = 52;
    const DOT_RADIUS = 12;
    const NUT_WIDTH = 6;

    // Fret marker positions (single and double dots)
    const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
    const DOUBLE_DOTS = [12, 24];

    // Interval-based colors
    const DEGREE_COLORS = {
        '1':  '#e94560',  // root — red
        'b2': '#f5a623',
        '2':  '#f5a623',  // 2nd — orange
        'b3': '#4ecdc4',
        '3':  '#4ecdc4',  // 3rd — teal
        '4':  '#a8d8ea',  // 4th — light blue
        'b5': '#7c4dff',
        '5':  '#45b7d1',  // 5th — blue
        'b6': '#c792ea',
        '6':  '#c792ea',  // 6th — purple
        'b7': '#f78c6c',
        '7':  '#f78c6c',  // 7th — salmon
    };

    const INTERVAL_NAMES = {
        0: 'P1', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
        6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7',
    };

    let currentData = null;

    // --- SVG helpers ---

    function svgEl(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    }

    function fretX(fret) {
        if (fret === 0) return PADDING_LEFT;
        return PADDING_LEFT + NUT_WIDTH + (fret - 0.5) * FRET_SPACING;
    }

    function fretLineX(fret) {
        if (fret === 0) return PADDING_LEFT + NUT_WIDTH;
        return PADDING_LEFT + NUT_WIDTH + fret * FRET_SPACING;
    }

    function stringY(stringIndex, numStrings) {
        // String 0 = lowest pitch = bottom of fretboard
        return PADDING_TOP + (numStrings - 1 - stringIndex) * STRING_SPACING;
    }

    // --- Render ---

    function render(data) {
        currentData = data;
        const svg = document.getElementById('fretboard');
        svg.innerHTML = '';

        const numStrings = data.tuning.strings.length;
        const numFrets = data.num_frets;
        const displayMode = document.getElementById('display-select').value;

        const width = PADDING_LEFT + NUT_WIDTH + numFrets * FRET_SPACING + PADDING_RIGHT;
        const height = PADDING_TOP + (numStrings - 1) * STRING_SPACING + PADDING_BOTTOM;

        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Fretboard background
        const fbX = PADDING_LEFT;
        const fbY = stringY(numStrings - 1, numStrings);
        const fbW = NUT_WIDTH + numFrets * FRET_SPACING;
        const fbH = (numStrings - 1) * STRING_SPACING;
        svg.appendChild(svgEl('rect', {
            x: fbX, y: fbY, width: fbW, height: fbH,
            fill: '#2a1810', rx: 2,
        }));

        // Nut
        svg.appendChild(svgEl('rect', {
            x: PADDING_LEFT, y: fbY, width: NUT_WIDTH, height: fbH,
            fill: '#ddd', rx: 1,
        }));

        // Fret markers (dots)
        const markerY = PADDING_TOP + (numStrings - 1) * STRING_SPACING / 2;
        for (const fret of SINGLE_DOTS) {
            if (fret <= numFrets) {
                const cx = PADDING_LEFT + NUT_WIDTH + (fret - 0.5) * FRET_SPACING;
                svg.appendChild(svgEl('circle', {
                    cx, cy: markerY, r: 4, fill: '#444',
                }));
            }
        }
        for (const fret of DOUBLE_DOTS) {
            if (fret <= numFrets) {
                const cx = PADDING_LEFT + NUT_WIDTH + (fret - 0.5) * FRET_SPACING;
                const offset = STRING_SPACING * 1.2;
                svg.appendChild(svgEl('circle', {
                    cx, cy: markerY - offset, r: 4, fill: '#444',
                }));
                svg.appendChild(svgEl('circle', {
                    cx, cy: markerY + offset, r: 4, fill: '#444',
                }));
            }
        }

        // Fret lines
        for (let f = 1; f <= numFrets; f++) {
            const x = fretLineX(f);
            svg.appendChild(svgEl('line', {
                x1: x, y1: fbY, x2: x, y2: fbY + fbH,
                stroke: '#555', 'stroke-width': f % 12 === 0 ? 2 : 1,
            }));
        }

        // Fret numbers
        for (let f = 1; f <= numFrets; f++) {
            if (SINGLE_DOTS.includes(f) || DOUBLE_DOTS.includes(f)) {
                const x = PADDING_LEFT + NUT_WIDTH + (f - 0.5) * FRET_SPACING;
                const text = svgEl('text', {
                    x, y: height - 5,
                    'text-anchor': 'middle', fill: '#666',
                    'font-size': '11',
                });
                text.textContent = f;
                svg.appendChild(text);
            }
        }

        // Strings
        for (let s = 0; s < numStrings; s++) {
            const y = stringY(s, numStrings);
            const thickness = 1 + (numStrings - 1 - s) * 0.3;
            svg.appendChild(svgEl('line', {
                x1: PADDING_LEFT, y1: y,
                x2: PADDING_LEFT + fbW, y2: y,
                stroke: '#bbb', 'stroke-width': thickness,
            }));

            // String label (open note)
            const label = svgEl('text', {
                x: PADDING_LEFT - 10, y: y + 4,
                'text-anchor': 'end', fill: '#999',
                'font-size': '13', 'font-weight': 'bold',
            });
            label.textContent = data.tuning.strings[s];
            svg.appendChild(label);
        }

        // Build a lookup for quick position checking
        const posSet = new Set();
        const posMap = {};
        for (const p of data.positions) {
            const key = `${p.string}-${p.fret}`;
            posSet.add(key);
            posMap[key] = p;
        }

        // Note dots
        for (const p of data.positions) {
            const cx = fretX(p.fret);
            const cy = stringY(p.string, numStrings);
            const color = DEGREE_COLORS[p.label] || '#888';
            const isRoot = p.label === '1';

            // Dot
            const circle = svgEl('circle', {
                cx, cy, r: DOT_RADIUS,
                fill: color,
                stroke: isRoot ? '#fff' : 'none',
                'stroke-width': isRoot ? 2 : 0,
                cursor: 'pointer',
                opacity: 0.9,
            });

            // Click to play
            circle.addEventListener('click', () => {
                AudioEngine.playMidi(p.midi, 0.6);
            });

            svg.appendChild(circle);

            // Label text
            let labelText = p.label;
            if (displayMode === 'note') {
                labelText = p.note;
            } else if (displayMode === 'interval') {
                labelText = INTERVAL_NAMES[p.pitch] || p.label;
            }

            const text = svgEl('text', {
                x: cx, y: cy + 4,
                'text-anchor': 'middle',
                fill: isRoot ? '#fff' : '#111',
                'font-size': labelText.length > 2 ? '9' : '11',
                'font-weight': isRoot ? 'bold' : 'normal',
                'pointer-events': 'none',
            });
            text.textContent = labelText;
            svg.appendChild(text);
        }

        // Update info bar
        updateInfoBar(data.info);
    }

    function updateInfoBar(info) {
        const bar = document.getElementById('info-bar');
        bar.innerHTML = '';

        const items = [
            ['Name', info.name || ''],
            ['Formula', info.formula || ''],
            ['Notes', (info.notes || []).join(' ')],
        ];

        for (const [label, value] of items) {
            if (!value) continue;
            const div = document.createElement('div');
            div.className = 'info-item';
            div.innerHTML = `<span class="info-label">${label}:</span> <span>${value}</span>`;
            bar.appendChild(div);
        }
    }

    // --- API fetch ---

    async function fetchAndRender() {
        const tuning = document.getElementById('tuning-select').value;
        const root = document.getElementById('root-select').value;
        const mode = document.getElementById('mode-select').value;
        const type = document.getElementById('type-select').value;

        const params = new URLSearchParams({ tuning, root, mode, type });
        const resp = await fetch(`/api/fretboard?${params}`);
        const data = await resp.json();

        if (data.error) {
            document.getElementById('info-bar').textContent = `Error: ${data.error}`;
            return;
        }

        render(data);
    }

    // --- Type selector update (scales vs chords) ---

    function updateTypeOptions() {
        const mode = document.getElementById('mode-select').value;
        const typeSelect = document.getElementById('type-select');
        const currentValue = typeSelect.value;

        // We'll fetch options from the page's data attributes or hardcode
        // For now, re-fetch available options via a simple approach
        typeSelect.innerHTML = '';

        if (mode === 'scale') {
            const scaleNames = JSON.parse(typeSelect.dataset.scales || '[]');
            for (const name of scaleNames) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                typeSelect.appendChild(opt);
            }
        } else {
            const chordTypes = JSON.parse(typeSelect.dataset.chords || '[]');
            for (const sym of chordTypes) {
                const opt = document.createElement('option');
                opt.value = sym;
                opt.textContent = sym || 'Major';
                typeSelect.appendChild(opt);
            }
        }

        fetchAndRender();
    }

    // --- Init ---

    function init() {
        // Store data on the type select for mode switching
        const typeSelect = document.getElementById('type-select');
        // Grab the initial options as scale names
        const scaleNames = Array.from(typeSelect.options).map(o => o.value);
        typeSelect.dataset.scales = JSON.stringify(scaleNames);

        // We need chord types too — extract from the page
        const chordScript = document.getElementById('chord-data');
        if (chordScript) {
            typeSelect.dataset.chords = chordScript.textContent;
        }

        // Event listeners
        document.getElementById('tuning-select').addEventListener('change', fetchAndRender);
        document.getElementById('root-select').addEventListener('change', fetchAndRender);
        document.getElementById('mode-select').addEventListener('change', updateTypeOptions);
        document.getElementById('type-select').addEventListener('change', fetchAndRender);
        document.getElementById('display-select').addEventListener('change', () => {
            if (currentData) render(currentData);
        });
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            AudioEngine.setVolume(e.target.value / 100);
        });

        // Initial render
        fetchAndRender();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { fetchAndRender, render };
})();
