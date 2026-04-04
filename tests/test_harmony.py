"""Tests for theory.harmony module."""

from theory.notes import Note
from theory.chords import Chord
from theory.harmony import diatonic_chords, analyze_chord_in_key


class TestDiatonicChords:
    def test_c_major_triads(self):
        chords = diatonic_chords('C', 'major')
        symbols = [dc.chord.symbol for dc in chords]
        assert symbols == ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']

    def test_c_major_sevenths(self):
        chords = diatonic_chords('C', 'major', sevenths=True)
        symbols = [dc.chord.symbol for dc in chords]
        assert symbols == ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']

    def test_a_minor_triads(self):
        chords = diatonic_chords('A', 'minor')
        symbols = [dc.chord.symbol for dc in chords]
        assert symbols == ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']

    def test_roman_numerals_major(self):
        chords = diatonic_chords('C', 'major')
        romans = [dc.roman for dc in chords]
        assert romans[0] == 'I'
        assert romans[1] == 'ii'
        assert romans[3] == 'IV'
        assert romans[4] == 'V'

    def test_functions(self):
        chords = diatonic_chords('C', 'major')
        assert chords[0].function == 'Tonic'      # I
        assert chords[3].function == 'Subdominant' # IV
        assert chords[4].function == 'Dominant'    # V

    def test_degree(self):
        chords = diatonic_chords('C', 'major')
        assert chords[0].degree == 1
        assert chords[6].degree == 7


class TestAnalyzeChord:
    def test_diatonic_chord(self):
        chord = Chord('G', '')
        result = analyze_chord_in_key(chord, 'C', 'major')
        assert result == 'V'

    def test_diatonic_seventh(self):
        chord = Chord('D', 'm7')
        result = analyze_chord_in_key(chord, 'C', 'major')
        assert result == 'ii7'

    def test_non_diatonic_returns_none(self):
        chord = Chord('A', '7')  # A7 is not diatonic to C major
        result = analyze_chord_in_key(chord, 'C', 'major')
        assert result is None
