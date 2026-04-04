# Guitar Theory Nerd

A web app for exploring music theory on the guitar — scales, chords, progressions, and ear training, all with interactive audio.

## Features

### Fretboard Explorer
Interactive SVG fretboard showing scales and chords across 8 tunings (Standard, D Standard, Drop C/D, C Standard, Open G/D, DADGAD). Click any note to hear it. Display modes for scale degrees, note names, or interval names.

### Chord Progressions
Browse 22+ named progressions (Pop Anthem, 12-Bar Blues, ii-V-I Jazz, Andalusian Cadence, Pachelbel Canon, etc.) in any key. Filter by genre tag. Play individual chords or the full progression with adjustable tempo.

### Scale & Chord Reference
Browsable encyclopedia of 21+ scales (major modes, melodic minor modes, pentatonics, blues, symmetric) and 35+ chord types (triads through 13ths, altered dominants). Color-coded interval badges, ascending/descending playback for scales, strum/arpeggio playback for chords.

### Ear Training
Interval, chord, and scale identification exercises at three difficulty levels. Tracks score, percentage, and streaks.

## Setup

Requires Python 3.10+.

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open [http://localhost:5000](http://localhost:5000).

## Tests

```sh
source .venv/bin/activate
pytest tests/ -v
```

## Project Structure

```
app.py                  Flask entry point
config.py               Defaults (tuning, fret count)
requirements.txt        Dependencies

theory/                 Music theory library (framework-independent)
  notes.py              Note, Interval, pitch classes, MIDI, frequency
  scales.py             Scale definitions, modes, interval patterns
  chords.py             Chord types, construction, identification
  fretboard.py          Fretboard model, tunings, position mapping
  harmony.py            Diatonic chords, Roman numeral analysis
  progressions.py       Progression templates and generation

routes/                 Flask blueprints
  fretboard.py          Fretboard page + /api/fretboard
  progressions.py       Progressions page + /api/progressions
  reference.py          Reference page + /api/reference/*
  ear_training.py       Ear training page + /api/ear-training/*

templates/              Jinja2 HTML templates
static/
  css/style.css         Dark theme styling
  js/fretboard.js       SVG fretboard renderer
  js/progressions.js    Progression explorer UI
  js/reference.js       Scale/chord reference UI
  js/ear_training.js    Ear training quiz UI
  js/audio.js           Web Audio API synthesis engine

tests/                  pytest suite (115 tests)
```

## Tech Stack

- **Backend:** Python, Flask
- **Frontend:** Vanilla JavaScript, SVG, Web Audio API
- **Audio:** Triangle wave synthesis with ADSR envelope
- **Testing:** pytest
