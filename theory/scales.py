"""
Scale and mode definitions.

Scales are defined as interval patterns (sequences of semitone steps).
Modes are derived by rotating the interval pattern of a parent scale.
"""

from __future__ import annotations

from .notes import Note, DEGREE_LABELS


class Scale:
    """A scale defined by a name and interval pattern."""

    def __init__(self, name: str, intervals: list[int], mode_names: list[str] | None = None):
        """
        Args:
            name: Display name of the scale.
            intervals: List of semitone distances from the root.
                       e.g., major = [0, 2, 4, 5, 7, 9, 11]
            mode_names: Optional names for each mode rotation.
        """
        self.name = name
        self.intervals = intervals
        self.mode_names = mode_names

    def notes(self, root: Note | str) -> list[Note]:
        """Return the notes of this scale starting from root."""
        if isinstance(root, str):
            root = Note(root)
        return [root.transpose(i) for i in self.intervals]

    def degree(self, n: int, root: Note | str) -> Note:
        """Return the note at scale degree n (1-indexed)."""
        if isinstance(root, str):
            root = Note(root)
        idx = (n - 1) % len(self.intervals)
        return root.transpose(self.intervals[idx])

    def formula(self) -> str:
        """Return the interval formula as degree labels (e.g., '1 2 b3 4 5 b6 b7')."""
        return ' '.join(DEGREE_LABELS[i] for i in self.intervals)

    def contains_pitch(self, pitch: int) -> bool:
        """Check if a pitch class offset is in this scale's intervals."""
        return (pitch % 12) in self.intervals

    def mode(self, degree: int) -> Scale:
        """
        Return a mode of this scale starting from the given degree (1-indexed).
        e.g., Scale("Major", ...).mode(2) returns Dorian.
        """
        idx = degree - 1
        rotated = self.intervals[idx:] + self.intervals[:idx]
        offset = rotated[0]
        new_intervals = [(i - offset) % 12 for i in rotated]

        if self.mode_names and 0 <= idx < len(self.mode_names):
            name = self.mode_names[idx]
        else:
            name = f"{self.name} mode {degree}"

        return Scale(name, new_intervals)

    def all_modes(self) -> list[Scale]:
        """Return all modes of this scale."""
        return [self.mode(i + 1) for i in range(len(self.intervals))]

    def __repr__(self):
        return f"Scale({self.name!r}, {self.intervals})"

    def __str__(self):
        return self.name


# --- Built-in scale library ---

MAJOR_MODE_NAMES = [
    'Ionian', 'Dorian', 'Phrygian', 'Lydian',
    'Mixolydian', 'Aeolian', 'Locrian',
]

MELODIC_MINOR_MODE_NAMES = [
    'Melodic Minor', 'Dorian b2', 'Lydian Augmented',
    'Lydian Dominant', 'Mixolydian b6', 'Locrian #2', 'Altered',
]

SCALES = {
    # Major and modes
    'major': Scale('Major', [0, 2, 4, 5, 7, 9, 11], MAJOR_MODE_NAMES),
    'ionian': Scale('Ionian', [0, 2, 4, 5, 7, 9, 11], MAJOR_MODE_NAMES),

    # Natural minor
    'natural_minor': Scale('Natural Minor', [0, 2, 3, 5, 7, 8, 10]),
    'aeolian': Scale('Aeolian', [0, 2, 3, 5, 7, 8, 10]),

    # Harmonic minor
    'harmonic_minor': Scale('Harmonic Minor', [0, 2, 3, 5, 7, 8, 11]),

    # Melodic minor (ascending)
    'melodic_minor': Scale('Melodic Minor', [0, 2, 3, 5, 7, 9, 11], MELODIC_MINOR_MODE_NAMES),

    # Pentatonics
    'pentatonic_major': Scale('Major Pentatonic', [0, 2, 4, 7, 9]),
    'pentatonic_minor': Scale('Minor Pentatonic', [0, 3, 5, 7, 10]),

    # Blues
    'blues': Scale('Blues', [0, 3, 5, 6, 7, 10]),

    # Symmetric
    'whole_tone': Scale('Whole Tone', [0, 2, 4, 6, 8, 10]),
    'diminished_hw': Scale('Diminished (H-W)', [0, 1, 3, 4, 6, 7, 9, 10]),
    'diminished_wh': Scale('Diminished (W-H)', [0, 2, 3, 5, 6, 8, 9, 11]),

    # Chromatic
    'chromatic': Scale('Chromatic', list(range(12))),
}

# Generate individual modes as top-level entries
_major = SCALES['major']
for i, mode_name in enumerate(MAJOR_MODE_NAMES):
    key = mode_name.lower()
    if key not in SCALES:
        SCALES[key] = _major.mode(i + 1)

_mel_minor = SCALES['melodic_minor']
for i, mode_name in enumerate(MELODIC_MINOR_MODE_NAMES):
    key = mode_name.lower().replace(' ', '_')
    if key not in SCALES:
        SCALES[key] = _mel_minor.mode(i + 1)


def get_scale(name: str) -> Scale:
    """Look up a scale by name (case-insensitive, spaces → underscores)."""
    key = name.lower().replace(' ', '_')
    if key in SCALES:
        return SCALES[key]
    raise ValueError(f"Unknown scale: {name!r}. Available: {', '.join(sorted(SCALES.keys()))}")


def all_scale_names() -> list[str]:
    """Return all available scale names."""
    return sorted(SCALES.keys())
