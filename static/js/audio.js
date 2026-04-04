/**
 * Web Audio API — simple tone synthesis for note playback.
 */

const AudioEngine = (() => {
    let ctx = null;
    let masterVolume = 0.5;

    function getContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    function setVolume(v) {
        masterVolume = Math.max(0, Math.min(1, v));
    }

    function getVolume() {
        return masterVolume;
    }

    /**
     * Play a note by frequency.
     * @param {number} frequency - Hz
     * @param {number} duration - seconds (default 0.5)
     * @param {string} waveform - 'sine', 'triangle', 'sawtooth', 'square'
     */
    function playFrequency(frequency, duration = 0.5, waveform = 'triangle') {
        const ac = getContext();
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = waveform;
        osc.frequency.setValueAtTime(frequency, ac.currentTime);

        // ADSR-ish envelope
        const peak = 0.3 * masterVolume;
        const sustain = 0.15 * masterVolume;
        gain.gain.setValueAtTime(0, ac.currentTime);
        gain.gain.linearRampToValueAtTime(peak, ac.currentTime + 0.02);  // attack
        gain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.001), ac.currentTime + 0.1);  // decay
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);  // release

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + duration);
    }

    /**
     * Play a note by MIDI number.
     * @param {number} midi - MIDI note number (60 = middle C)
     * @param {number} duration - seconds
     */
    function playMidi(midi, duration = 0.5) {
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        playFrequency(freq, duration);
    }

    /**
     * Play a note given a pitch class (0-11) and octave.
     * @param {number} pitch - pitch class 0-11
     * @param {number} octave - octave number (4 = middle)
     * @param {number} duration - seconds
     */
    function playNote(pitch, octave = 3, duration = 0.5) {
        const midi = pitch + (octave + 1) * 12;
        playMidi(midi, duration);
    }

    /**
     * Play multiple notes simultaneously (chord).
     * @param {number[]} midis - array of MIDI note numbers
     * @param {number} duration - seconds
     */
    function playChord(midis, duration = 1.0) {
        midis.forEach(m => playMidi(m, duration));
    }

    return { playFrequency, playMidi, playNote, playChord, getContext, setVolume, getVolume };
})();
