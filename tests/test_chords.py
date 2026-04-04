"""Tests for theory.chords module."""

import pytest
from theory.notes import Note
from theory.chords import Chord, identify_chord, get_chord_type, all_chord_type_symbols


class TestChord:
    def test_major_triad(self):
        c = Chord('C', '')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [0, 4, 7]  # C E G

    def test_minor_triad(self):
        c = Chord('A', 'm')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [9, 0, 4]  # A C E

    def test_dom7(self):
        c = Chord('G', '7')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [7, 11, 2, 5]  # G B D F

    def test_maj7(self):
        c = Chord('C', 'maj7')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [0, 4, 7, 11]  # C E G B

    def test_m7(self):
        c = Chord('D', 'm7')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [2, 5, 9, 0]  # D F A C

    def test_dim7(self):
        c = Chord('B', 'dim7')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [11, 2, 5, 8]  # B D F Ab

    def test_m7b5(self):
        c = Chord('B', 'm7b5')
        notes = c.notes()
        pitches = [n.pitch for n in notes]
        assert pitches == [11, 2, 5, 9]  # B D F A

    def test_symbol(self):
        assert Chord('C', 'maj7').symbol == 'Cmaj7'
        assert Chord('A', 'm').symbol == 'Am'
        assert Chord('G', '7').symbol == 'G7'
        assert Chord('F#', 'dim').symbol == 'F#dim'

    def test_full_name(self):
        assert 'Major 7th' in Chord('C', 'maj7').full_name

    def test_formula(self):
        assert Chord('C', '').formula() == '1 3 5'
        assert Chord('C', 'm').formula() == '1 b3 5'
        assert Chord('C', '7').formula() == '1 3 5 b7'

    def test_pitch_classes(self):
        c = Chord('C', '')
        assert c.pitch_classes() == {0, 4, 7}

    def test_altered_7b9(self):
        c = Chord('C', '7b9')
        pitches = [n.pitch for n in c.notes()]
        # C E G Bb Db -> 0 4 7 10 1
        assert pitches == [0, 4, 7, 10, 1]

    def test_altered_7sharp9(self):
        c = Chord('C', '7#9')
        pitches = [n.pitch for n in c.notes()]
        # C E G Bb D# -> 0 4 7 10 3
        assert pitches == [0, 4, 7, 10, 3]

    def test_sus_chords(self):
        sus2 = Chord('C', 'sus2')
        assert [n.pitch for n in sus2.notes()] == [0, 2, 7]

        sus4 = Chord('C', 'sus4')
        assert [n.pitch for n in sus4.notes()] == [0, 5, 7]

    def test_unknown_type_raises(self):
        with pytest.raises(ValueError):
            Chord('C', 'nonexistent')

    def test_note_object_root(self):
        c = Chord(Note('C'), 'maj7')
        assert c.symbol == 'Cmaj7'


class TestIdentifyChord:
    def test_identify_major(self):
        results = identify_chord([Note('C'), Note('E'), Note('G')])
        assert 'C' in results

    def test_identify_minor(self):
        results = identify_chord([Note('A'), Note('C'), Note('E')])
        assert 'Am' in results

    def test_identify_dom7(self):
        results = identify_chord([Note('G'), Note('B'), Note('D'), Note('F')])
        assert 'G7' in results

    def test_identify_with_strings(self):
        results = identify_chord(['C', 'E', 'G'])
        assert 'C' in results

    def test_identify_inversion(self):
        # E G C should still identify as C major (first inversion)
        results = identify_chord([Note('E'), Note('G'), Note('C')])
        assert 'C' in results


class TestChordTypeHelpers:
    def test_get_chord_type(self):
        ct = get_chord_type('m7')
        assert ct.intervals == [0, 3, 7, 10]

    def test_unknown_raises(self):
        with pytest.raises(ValueError):
            get_chord_type('zzz')

    def test_all_chord_type_symbols(self):
        syms = all_chord_type_symbols()
        assert 'm7' in syms
        assert 'maj7' in syms
        assert '' in syms  # major triad
