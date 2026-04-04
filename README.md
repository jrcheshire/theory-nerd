# Theory Nerd

A web app for exploring music theory on the guitar — scales, chords, progressions, and ear training, all with interactive audio.

No server, no dependencies — just HTML, JS, and CSS.

## Features

### Fretboard Explorer
Interactive SVG fretboard showing scales and chords across 8 tunings (Standard, D Standard, Drop C/D, C Standard, Open G/D, DADGAD). Click any note to hear it. Display modes for scale degrees, note names, or interval names.

### Chord Progressions
Browse 22+ named progressions (Pop Anthem, 12-Bar Blues, ii-V-I Jazz, Andalusian Cadence, Pachelbel Canon, etc.) in any key. Filter by genre tag. Play individual chords or the full progression with adjustable tempo.

### Scale & Chord Reference
Browsable encyclopedia of 21+ scales (major modes, melodic minor modes, pentatonics, blues, symmetric) and 35+ chord types (triads through 13ths, altered dominants). Color-coded interval badges, ascending/descending playback for scales, strum/arpeggio playback for chords.

### Ear Training
Interval, chord, and scale identification exercises at three difficulty levels. Tracks score, percentage, and streaks.

## Usage

**Local:**
```sh
python3 -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080).

**Deploy:** Upload to any web host, CDN, or GitHub Pages.

## Project Structure

```
index.html              Single-page app with hash routing
css/style.css           Dark theme styling
js/
  app.js                SPA router and page controllers
  audio.js              Web Audio API synthesis engine
  theory/               Music theory library (ES modules)
    notes.js            Note, Interval, pitch classes, MIDI
    scales.js           Scale definitions, modes, patterns
    chords.js           Chord types, construction, identification
    fretboard.js        Fretboard model, tunings, positions
    harmony.js          Diatonic chords, Roman numeral analysis
    progressions.js     Progression templates and generation
```

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES modules), SVG, Web Audio API
- **Audio:** Triangle wave synthesis with ADSR envelope

## License

GPL-3.0
