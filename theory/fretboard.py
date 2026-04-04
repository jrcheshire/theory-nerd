"""
Fretboard model — maps notes, scales, and chords to string/fret positions.

Supports arbitrary tunings with preconfigured presets for
standard, D standard, Drop C, and C standard.
"""

from __future__ import annotations

from .notes import Note, DEGREE_LABELS


class Tuning:
    """A guitar tuning defined as a list of open-string notes (low to high)."""

    def __init__(self, name: str, strings: list[str]):
        """
        Args:
            name: Display name (e.g., 'D Standard').
            strings: Note names from lowest to highest string.
        """
        self.name = name
        self.string_notes = [Note(s) for s in strings]

    @property
    def num_strings(self) -> int:
        return len(self.string_notes)

    def __repr__(self):
        names = [n.name for n in self.string_notes]
        return f"Tuning({self.name!r}, {names})"

    def __str__(self):
        return self.name


# Preset tunings
TUNINGS = {
    'standard': Tuning('Standard', ['E', 'A', 'D', 'G', 'B', 'E']),
    'd_standard': Tuning('D Standard', ['D', 'G', 'C', 'F', 'A', 'D']),
    'drop_c': Tuning('Drop C', ['C', 'G', 'C', 'F', 'A', 'D']),
    'c_standard': Tuning('C Standard', ['C', 'F', 'Bb', 'Eb', 'G', 'C']),
    'drop_d': Tuning('Drop D', ['D', 'A', 'D', 'G', 'B', 'E']),
    'open_g': Tuning('Open G', ['D', 'G', 'D', 'G', 'B', 'D']),
    'open_d': Tuning('Open D', ['D', 'A', 'D', 'F#', 'A', 'D']),
    'dadgad': Tuning('DADGAD', ['D', 'A', 'D', 'G', 'A', 'D']),
}


class FretPosition:
    """A position on the fretboard."""

    __slots__ = ('string', 'fret', 'note', 'label')

    def __init__(self, string: int, fret: int, note: Note, label: str = ''):
        self.string = string  # 0 = lowest string
        self.fret = fret      # 0 = open string
        self.note = note
        self.label = label    # degree label, interval name, or note name

    def __repr__(self):
        return f"FretPosition(s={self.string}, f={self.fret}, {self.note.name}, {self.label!r})"

    def to_dict(self) -> dict:
        return {
            'string': self.string,
            'fret': self.fret,
            'note': self.note.name,
            'label': self.label,
            'pitch': self.note.pitch,
        }


class Fretboard:
    """A fretboard model for mapping notes, scales, and chords to positions."""

    def __init__(self, tuning: Tuning | str = 'standard', num_frets: int = 24):
        if isinstance(tuning, str):
            key = tuning.lower().replace(' ', '_')
            if key not in TUNINGS:
                raise ValueError(f"Unknown tuning: {tuning!r}. Available: {', '.join(TUNINGS.keys())}")
            self.tuning = TUNINGS[key]
        else:
            self.tuning = tuning
        self.num_frets = num_frets

    def note_at(self, string: int, fret: int) -> Note:
        """Return the note at a given string and fret."""
        open_note = self.tuning.string_notes[string]
        return open_note.transpose(fret)

    def find_note(self, note: Note | str) -> list[FretPosition]:
        """Find all positions of a note on the fretboard."""
        if isinstance(note, str):
            note = Note(note)
        positions = []
        for s in range(self.tuning.num_strings):
            for f in range(self.num_frets + 1):
                n = self.note_at(s, f)
                if n.pitch == note.pitch:
                    positions.append(FretPosition(s, f, n, note.name))
        return positions

    def map_scale(self, scale, root: Note | str) -> list[FretPosition]:
        """
        Map a scale onto the fretboard.

        Args:
            scale: A Scale object.
            root: The root note.

        Returns:
            List of FretPositions with degree labels.
        """
        if isinstance(root, str):
            root = Note(root)

        scale_pitches = {(root.pitch + i) % 12: DEGREE_LABELS[i] for i in scale.intervals}
        positions = []

        for s in range(self.tuning.num_strings):
            for f in range(self.num_frets + 1):
                n = self.note_at(s, f)
                if n.pitch in scale_pitches:
                    label = scale_pitches[n.pitch]
                    positions.append(FretPosition(s, f, n, label))

        return positions

    def map_chord(self, chord) -> list[FretPosition]:
        """
        Map a chord's notes onto the fretboard.

        Args:
            chord: A Chord object.

        Returns:
            List of FretPositions with interval labels.
        """
        chord_pitches = {}
        for i in chord.chord_type.intervals:
            pitch = (chord.root.pitch + i) % 12
            chord_pitches[pitch] = DEGREE_LABELS.get(i % 12, str(i))

        positions = []
        for s in range(self.tuning.num_strings):
            for f in range(self.num_frets + 1):
                n = self.note_at(s, f)
                if n.pitch in chord_pitches:
                    label = chord_pitches[n.pitch]
                    positions.append(FretPosition(s, f, n, label))

        return positions

    def all_notes(self) -> list[list[Note]]:
        """Return a 2D array of all notes [string][fret]."""
        return [
            [self.note_at(s, f) for f in range(self.num_frets + 1)]
            for s in range(self.tuning.num_strings)
        ]


def get_tuning(name: str) -> Tuning:
    """Look up a tuning by name."""
    key = name.lower().replace(' ', '_')
    if key in TUNINGS:
        return TUNINGS[key]
    raise ValueError(f"Unknown tuning: {name!r}")


def all_tuning_names() -> list[str]:
    """Return all available tuning names."""
    return sorted(TUNINGS.keys())
