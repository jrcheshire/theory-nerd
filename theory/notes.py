"""
Note and Interval representation for music theory.

Notes are pitch classes (0-11) with enharmonic spelling support.
Intervals measure the distance between notes with proper quality names.
"""

from __future__ import annotations

SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

# Map any note name to its pitch class
_NAME_TO_PITCH = {}
for i, name in enumerate(SHARP_NAMES):
    _NAME_TO_PITCH[name] = i
for i, name in enumerate(FLAT_NAMES):
    _NAME_TO_PITCH[name] = i
# Double sharps/flats and common alternates
_NAME_TO_PITCH.update({
    'E#': 5, 'B#': 0, 'Cb': 11, 'Fb': 4,
})

# Preferred spelling per pitch class for sharp and flat contexts
# Index 0 = sharp preference, 1 = flat preference
_SPELLING = {
    0: ('C', 'C'), 1: ('C#', 'Db'), 2: ('D', 'D'), 3: ('D#', 'Eb'),
    4: ('E', 'E'), 5: ('F', 'F'), 6: ('F#', 'Gb'), 7: ('G', 'G'),
    8: ('G#', 'Ab'), 9: ('A', 'A'), 10: ('A#', 'Bb'), 11: ('B', 'B'),
}

# Keys that prefer flats
FLAT_KEYS = {'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb',
             'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'}


class Note:
    """A musical note as a pitch class (0-11) with a specific spelling."""

    __slots__ = ('pitch', 'name', 'octave')

    def __init__(self, name: str, octave: int | None = None):
        if name not in _NAME_TO_PITCH:
            raise ValueError(f"Unknown note name: {name!r}")
        self.name = name
        self.pitch = _NAME_TO_PITCH[name]
        self.octave = octave

    @classmethod
    def from_pitch(cls, pitch: int, prefer_flat: bool = False) -> Note:
        """Create a Note from a pitch class (0-11)."""
        pitch = pitch % 12
        name = _SPELLING[pitch][1 if prefer_flat else 0]
        return cls(name)

    @classmethod
    def from_pitch_in_key(cls, pitch: int, key: str) -> Note:
        """Create a Note spelled appropriately for the given key."""
        prefer_flat = key in FLAT_KEYS
        return cls.from_pitch(pitch, prefer_flat=prefer_flat)

    def enharmonic(self) -> Note:
        """Return the enharmonic equivalent (sharp <-> flat)."""
        sharp, flat = _SPELLING[self.pitch]
        other = flat if self.name == sharp else sharp
        return Note(other, self.octave)

    def transpose(self, semitones: int) -> Note:
        """Transpose by a number of semitones, preserving sharp/flat preference."""
        new_pitch = (self.pitch + semitones) % 12
        prefer_flat = 'b' in self.name
        return Note.from_pitch(new_pitch, prefer_flat=prefer_flat)

    def interval_to(self, other: Note) -> Interval:
        """Return the interval from this note up to another note."""
        semitones = (other.pitch - self.pitch) % 12
        return Interval(semitones)

    def __add__(self, interval: Interval) -> Note:
        """Note + Interval = new Note."""
        if not isinstance(interval, Interval):
            return NotImplemented
        return self.transpose(interval.semitones)

    def __sub__(self, other):
        """Note - Note = Interval."""
        if isinstance(other, Note):
            return self.interval_to(other)
        if isinstance(other, Interval):
            return self.transpose(-other.semitones)
        return NotImplemented

    def __eq__(self, other):
        if isinstance(other, Note):
            return self.pitch == other.pitch
        return NotImplemented

    def __hash__(self):
        return hash(self.pitch)

    def __repr__(self):
        if self.octave is not None:
            return f"Note({self.name!r}, octave={self.octave})"
        return f"Note({self.name!r})"

    def __str__(self):
        if self.octave is not None:
            return f"{self.name}{self.octave}"
        return self.name

    def with_octave(self, octave: int) -> Note:
        """Return a copy with a specific octave."""
        return Note(self.name, octave)

    def midi(self) -> int | None:
        """Return MIDI note number, or None if no octave is set."""
        if self.octave is None:
            return None
        return self.pitch + (self.octave + 1) * 12

    def frequency(self) -> float | None:
        """Return frequency in Hz (A4 = 440Hz), or None if no octave."""
        m = self.midi()
        if m is None:
            return None
        return 440.0 * (2 ** ((m - 69) / 12))


# --- Interval ---

# Interval names indexed by semitone count
INTERVAL_NAMES = {
    0: 'P1', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
    6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7',
}

# Long names for display
INTERVAL_LONG_NAMES = {
    0: 'Unison', 1: 'Minor 2nd', 2: 'Major 2nd', 3: 'Minor 3rd',
    4: 'Major 3rd', 5: 'Perfect 4th', 6: 'Tritone', 7: 'Perfect 5th',
    8: 'Minor 6th', 9: 'Major 6th', 10: 'Minor 7th', 11: 'Major 7th',
}

# Scale degree formula labels (used for scale/chord formulas)
DEGREE_LABELS = {
    0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
    6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
}

# Alternate degree labels for chords (e.g., #4 instead of b5)
DEGREE_LABELS_SHARP = {
    0: '1', 1: 'b2', 2: '2', 3: '#2', 4: '3', 5: '4',
    6: '#4', 7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7',
}


class Interval:
    """An interval measured in semitones (0-11 for single octave)."""

    __slots__ = ('semitones',)

    def __init__(self, semitones: int):
        self.semitones = semitones % 12

    @classmethod
    def from_name(cls, name: str) -> Interval:
        """Create an Interval from a short name like 'P5', 'm3', 'M7'."""
        for st, n in INTERVAL_NAMES.items():
            if n == name:
                return cls(st)
        raise ValueError(f"Unknown interval name: {name!r}")

    @property
    def name(self) -> str:
        return INTERVAL_NAMES[self.semitones]

    @property
    def long_name(self) -> str:
        return INTERVAL_LONG_NAMES[self.semitones]

    @property
    def degree_label(self) -> str:
        return DEGREE_LABELS[self.semitones]

    def __eq__(self, other):
        if isinstance(other, Interval):
            return self.semitones == other.semitones
        return NotImplemented

    def __hash__(self):
        return hash(self.semitones)

    def __add__(self, other):
        if isinstance(other, Interval):
            return Interval(self.semitones + other.semitones)
        return NotImplemented

    def __repr__(self):
        return f"Interval({self.semitones})  # {self.name}"

    def __str__(self):
        return self.name


# Convenience: commonly used intervals
P1 = Interval(0)
m2 = Interval(1)
M2 = Interval(2)
m3 = Interval(3)
M3 = Interval(4)
P4 = Interval(5)
TT = Interval(6)
P5 = Interval(7)
m6 = Interval(8)
M6 = Interval(9)
m7 = Interval(10)
M7 = Interval(11)
