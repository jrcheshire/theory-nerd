# Theory Nerd

A web app for exploring music theory on the guitar — scales, chords, progressions, and ear training, all with interactive audio.

Available as a **static site** (no server required — just HTML/JS/CSS) or as a **Flask app** with a Python backend.

## Features

### Fretboard Explorer
Interactive SVG fretboard showing scales and chords across 8 tunings (Standard, D Standard, Drop C/D, C Standard, Open G/D, DADGAD). Click any note to hear it. Display modes for scale degrees, note names, or interval names.

### Chord Progressions
Browse 22+ named progressions (Pop Anthem, 12-Bar Blues, ii-V-I Jazz, Andalusian Cadence, Pachelbel Canon, etc.) in any key. Filter by genre tag. Play individual chords or the full progression with adjustable tempo.

### Scale & Chord Reference
Browsable encyclopedia of 21+ scales (major modes, melodic minor modes, pentatonics, blues, symmetric) and 35+ chord types (triads through 13ths, altered dominants). Color-coded interval badges, ascending/descending playback for scales, strum/arpeggio playback for chords.

### Ear Training
Interval, chord, and scale identification exercises at three difficulty levels. Tracks score, percentage, and streaks.

## Static Site (Recommended)

The `site/` directory is a fully self-contained static app — no server, no dependencies. Just serve the files.

**Local:**
```sh
cd site
python3 -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080).

**Deploy:** Upload the contents of `site/` to any web host, CDN, or GitHub Pages.

## Flask App (Development)

The Flask version lives in the project root. Useful for development and testing the Python theory library.

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open [http://localhost:5000](http://localhost:5000).

### Tests

```sh
source .venv/bin/activate
pytest tests/ -v
```

115 tests covering the full theory library.

## Project Structure

```
site/                       Static site (deploy this)
  index.html                Single-page app with hash routing
  css/style.css             Dark theme styling
  js/app.js                 SPA router and page controllers
  js/audio.js               Web Audio API synthesis engine
  js/theory/                Music theory library (ES modules)
    notes.js                Note, Interval, pitch classes, MIDI
    scales.js               Scale definitions, modes, patterns
    chords.js               Chord types, construction, identification
    fretboard.js            Fretboard model, tunings, positions
    harmony.js              Diatonic chords, Roman numeral analysis
    progressions.js         Progression templates and generation

theory/                     Python theory library
routes/                     Flask blueprints
templates/                  Jinja2 templates
static/                     Flask static assets
tests/                      pytest suite (115 tests)
```

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES modules), SVG, Web Audio API
- **Audio:** Triangle wave synthesis with ADSR envelope
- **Backend (optional):** Python, Flask
- **Testing:** pytest

## License

GPL-3.0
