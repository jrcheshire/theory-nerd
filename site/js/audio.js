/**
 * Web Audio API — simple tone synthesis for note playback.
 */

let ctx = null;
let masterVolume = 0.5;

function getContext() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
}

export function setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
}

export function getVolume() {
    return masterVolume;
}

export function playFrequency(frequency, duration = 0.5, waveform = 'triangle') {
    const ac = getContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);

    // Boost low frequencies — they're physically quieter on small speakers
    const lowBoost = frequency < 200 ? Math.max(1.0, 2.5 - frequency / 130) : 1.0;
    const peak = 0.3 * masterVolume * lowBoost;
    const sustain = 0.15 * masterVolume * lowBoost;
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.001), ac.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
}

export function playMidi(midi, duration = 0.5) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    playFrequency(freq, duration);
}

export function playNote(pitch, octave = 3, duration = 0.5) {
    const midi = pitch + (octave + 1) * 12;
    playMidi(midi, duration);
}

export function playChord(midis, duration = 1.0) {
    midis.forEach(m => playMidi(m, duration));
}
