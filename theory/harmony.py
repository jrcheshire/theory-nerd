"""
Functional harmony: diatonic chord generation and Roman numeral analysis.

Phase 1 stub — covers diatonic chords and basic analysis.
Full implementation (secondary dominants, substitutions, modulation) in Phase 3.
"""

from __future__ import annotations

from .notes import Note
from .scales import SCALES
from .chords import Chord


# Roman numeral labels
_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

# Triad quality for each degree of the major scale
_MAJOR_TRIAD_TYPES = ['', 'm', 'm', '', '', 'm', 'dim']
_MAJOR_SEVENTH_TYPES = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5']

# Triad quality for each degree of the natural minor scale
_MINOR_TRIAD_TYPES = ['m', 'dim', '', 'm', 'm', '', '']
_MINOR_SEVENTH_TYPES = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7']


class DiatonicChord:
    """A chord in the context of a key, with Roman numeral analysis."""

    def __init__(self, degree: int, chord: Chord, roman: str, function: str):
        self.degree = degree        # 1-indexed scale degree
        self.chord = chord          # The actual Chord object
        self.roman = roman          # Roman numeral label (e.g., 'ii', 'V7')
        self.function = function    # Tonic / Subdominant / Dominant

    def __repr__(self):
        return f"DiatonicChord({self.roman}, {self.chord.symbol})"

    def __str__(self):
        return f"{self.roman} ({self.chord.symbol})"


def _roman_for(degree: int, chord_type_symbol: str) -> str:
    """Build a Roman numeral string from degree and chord type."""
    base = _ROMAN[degree]
    is_minor = chord_type_symbol in ('m', 'm7', 'm7b5', 'dim', 'dim7')
    numeral = base.lower() if is_minor else base

    # Append quality indicator
    if chord_type_symbol == 'dim':
        return numeral + '\u00b0'  # degree symbol
    elif chord_type_symbol == 'aug':
        return numeral + '+'
    elif chord_type_symbol in ('', 'm'):
        return numeral
    elif chord_type_symbol == 'm7b5':
        return numeral + '\u00b0' + '7'  # half-dim shown as °7 for now
    else:
        # Strip 'm' prefix for display, keep 7/maj7/etc.
        suffix = chord_type_symbol
        if suffix.startswith('m') and suffix != 'maj7':
            suffix = suffix[1:]
        return numeral + suffix


def _function_label(degree: int) -> str:
    """Return functional label for a scale degree (1-indexed)."""
    if degree in (1, 3):
        return 'Tonic'
    elif degree in (2, 4):
        return 'Subdominant'
    elif degree in (5, 7):
        return 'Dominant'
    elif degree == 6:
        return 'Tonic'  # vi is tonic-function in most analysis
    return 'Unknown'


def diatonic_chords(
    root: Note | str,
    quality: str = 'major',
    sevenths: bool = False,
) -> list[DiatonicChord]:
    """
    Generate diatonic chords for a key.

    Args:
        root: The key root note.
        quality: 'major' or 'minor' (natural minor).
        sevenths: If True, generate 7th chords instead of triads.
    """
    if isinstance(root, str):
        root = Note(root)

    if quality == 'major':
        scale = SCALES['major']
        type_list = _MAJOR_SEVENTH_TYPES if sevenths else _MAJOR_TRIAD_TYPES
    elif quality == 'minor':
        scale = SCALES['natural_minor']
        type_list = _MINOR_SEVENTH_TYPES if sevenths else _MINOR_TRIAD_TYPES
    else:
        raise ValueError(f"Unsupported key quality: {quality!r}")

    scale_notes = scale.notes(root)
    chords = []

    for i in range(7):
        chord_root = scale_notes[i]
        ct_symbol = type_list[i]
        chord = Chord(chord_root, ct_symbol)
        roman = _roman_for(i, ct_symbol)
        func = _function_label(i + 1)
        chords.append(DiatonicChord(i + 1, chord, roman, func))

    return chords


def analyze_chord_in_key(
    chord: Chord,
    key_root: Note | str,
    key_quality: str = 'major',
) -> str | None:
    """
    Analyze a chord in the context of a key. Returns Roman numeral or None.

    This is a basic implementation — checks if the chord matches a diatonic chord.
    Phase 3 will add secondary dominant detection, borrowed chords, etc.
    """
    diatonic = diatonic_chords(key_root, key_quality,
                               sevenths=len(chord.chord_type.intervals) > 3)
    for dc in diatonic:
        if (dc.chord.root.pitch == chord.root.pitch and
                dc.chord.chord_type.symbol == chord.chord_type.symbol):
            return dc.roman
    return None
