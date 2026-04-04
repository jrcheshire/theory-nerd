"""
Chord construction, naming, and identification.

Chords are defined as a root note plus a set of intervals.
Supports triads through 13ths, including altered and extended voicings.
"""

from __future__ import annotations

from .notes import Note, Interval, DEGREE_LABELS


class ChordType:
    """A chord type defined by its symbol and interval structure."""

    def __init__(self, symbol: str, intervals: list[int], full_name: str = ''):
        """
        Args:
            symbol: Chord symbol suffix (e.g., 'm7', 'maj7', '7#9').
            intervals: Semitone distances from root (e.g., [0, 4, 7] for major).
            full_name: Human-readable name.
        """
        self.symbol = symbol
        self.intervals = intervals
        self.full_name = full_name or symbol

    def __repr__(self):
        return f"ChordType({self.symbol!r}, {self.intervals})"


# --- Chord type library ---

CHORD_TYPES: dict[str, ChordType] = {}


def _reg(symbol: str, intervals: list[int], full_name: str = '') -> None:
    CHORD_TYPES[symbol] = ChordType(symbol, intervals, full_name)


# Triads
_reg('', [0, 4, 7], 'Major')
_reg('m', [0, 3, 7], 'Minor')
_reg('dim', [0, 3, 6], 'Diminished')
_reg('aug', [0, 4, 8], 'Augmented')
_reg('sus2', [0, 2, 7], 'Suspended 2nd')
_reg('sus4', [0, 5, 7], 'Suspended 4th')

# Sixths
_reg('6', [0, 4, 7, 9], 'Major 6th')
_reg('m6', [0, 3, 7, 9], 'Minor 6th')

# Sevenths
_reg('7', [0, 4, 7, 10], 'Dominant 7th')
_reg('maj7', [0, 4, 7, 11], 'Major 7th')
_reg('m7', [0, 3, 7, 10], 'Minor 7th')
_reg('m(maj7)', [0, 3, 7, 11], 'Minor Major 7th')
_reg('m7b5', [0, 3, 6, 10], 'Half-Diminished 7th')
_reg('dim7', [0, 3, 6, 9], 'Diminished 7th')
_reg('aug7', [0, 4, 8, 10], 'Augmented 7th')
_reg('aug(maj7)', [0, 4, 8, 11], 'Augmented Major 7th')
_reg('7sus4', [0, 5, 7, 10], 'Dominant 7th sus4')

# Ninths
_reg('9', [0, 4, 7, 10, 14], 'Dominant 9th')
_reg('maj9', [0, 4, 7, 11, 14], 'Major 9th')
_reg('m9', [0, 3, 7, 10, 14], 'Minor 9th')
_reg('add9', [0, 4, 7, 14], 'Add 9')

# Elevenths
_reg('11', [0, 4, 7, 10, 14, 17], 'Dominant 11th')
_reg('m11', [0, 3, 7, 10, 14, 17], 'Minor 11th')

# Thirteenths
_reg('13', [0, 4, 7, 10, 14, 21], 'Dominant 13th')
_reg('maj13', [0, 4, 7, 11, 14, 21], 'Major 13th')
_reg('m13', [0, 3, 7, 10, 14, 21], 'Minor 13th')

# Altered dominants
_reg('7b9', [0, 4, 7, 10, 13], 'Dominant 7th flat 9')
_reg('7#9', [0, 4, 7, 10, 15], 'Dominant 7th sharp 9')
_reg('7#11', [0, 4, 7, 10, 18], 'Dominant 7th sharp 11')
_reg('7b13', [0, 4, 7, 10, 20], 'Dominant 7th flat 13')
_reg('7b5', [0, 4, 6, 10], 'Dominant 7th flat 5')
_reg('7#5', [0, 4, 8, 10], 'Dominant 7th sharp 5')
_reg('7alt', [0, 4, 6, 10, 13], 'Altered Dominant')

del _reg


class Chord:
    """A specific chord: root note + chord type."""

    def __init__(self, root: Note | str, chord_type: str | ChordType = ''):
        if isinstance(root, str):
            root = Note(root)
        self.root = root

        if isinstance(chord_type, str):
            if chord_type not in CHORD_TYPES:
                raise ValueError(
                    f"Unknown chord type: {chord_type!r}. "
                    f"Available: {', '.join(sorted(CHORD_TYPES.keys()))}"
                )
            self.chord_type = CHORD_TYPES[chord_type]
        else:
            self.chord_type = chord_type

    def notes(self) -> list[Note]:
        """Return the notes in this chord."""
        return [self.root.transpose(i) for i in self.chord_type.intervals]

    def pitch_classes(self) -> set[int]:
        """Return the set of pitch classes (0-11) in this chord."""
        return {(self.root.pitch + i) % 12 for i in self.chord_type.intervals}

    def intervals(self) -> list[Interval]:
        """Return the intervals from the root."""
        return [Interval(i) for i in self.chord_type.intervals]

    def formula(self) -> str:
        """Return interval formula (e.g., '1 3 5 b7')."""
        labels = []
        for i in self.chord_type.intervals:
            semitones = i % 12
            labels.append(DEGREE_LABELS.get(semitones, str(i)))
        return ' '.join(labels)

    @property
    def symbol(self) -> str:
        """Full chord symbol (e.g., 'Am7', 'C#maj7')."""
        return f"{self.root.name}{self.chord_type.symbol}"

    @property
    def full_name(self) -> str:
        """Full descriptive name (e.g., 'A Minor 7th')."""
        return f"{self.root.name} {self.chord_type.full_name}"

    def __repr__(self):
        return f"Chord({self.root.name!r}, {self.chord_type.symbol!r})"

    def __str__(self):
        return self.symbol


def identify_chord(notes: list[Note | str]) -> list[str]:
    """
    Given a list of notes, return possible chord names.
    Tries each note as a potential root.
    """
    pitches = []
    for n in notes:
        if isinstance(n, str):
            n = Note(n)
        pitches.append(n.pitch)

    results = []
    for root_pitch in pitches:
        intervals_from_root = sorted((p - root_pitch) % 12 for p in pitches)
        for symbol, ct in CHORD_TYPES.items():
            ct_intervals_mod12 = sorted(i % 12 for i in ct.intervals)
            if intervals_from_root == ct_intervals_mod12:
                root_note = Note.from_pitch(root_pitch)
                results.append(f"{root_note.name}{symbol}")

    return results


def get_chord_type(symbol: str) -> ChordType:
    """Look up a chord type by symbol."""
    if symbol in CHORD_TYPES:
        return CHORD_TYPES[symbol]
    raise ValueError(f"Unknown chord type: {symbol!r}")


def all_chord_type_symbols() -> list[str]:
    """Return all available chord type symbols."""
    return sorted(CHORD_TYPES.keys())
