"""Tests for theory.notes module."""

import pytest
from theory.notes import Note, Interval, P1, m3, M3, P5, m7, M7


class TestNote:
    def test_create(self):
        n = Note('C')
        assert n.name == 'C'
        assert n.pitch == 0

    def test_pitch_class(self):
        assert Note('C').pitch == 0
        assert Note('E').pitch == 4
        assert Note('B').pitch == 11
        assert Note('C#').pitch == 1
        assert Note('Db').pitch == 1

    def test_enharmonic_equality(self):
        assert Note('C#') == Note('Db')
        assert Note('F#') == Note('Gb')

    def test_enharmonic_swap(self):
        n = Note('C#')
        assert n.enharmonic().name == 'Db'
        assert Note('Db').enharmonic().name == 'C#'

    def test_transpose(self):
        c = Note('C')
        assert c.transpose(4).pitch == 4   # C -> E
        assert c.transpose(7).pitch == 7   # C -> G
        assert c.transpose(12).pitch == 0  # C -> C (octave)

    def test_interval_to(self):
        c = Note('C')
        e = Note('E')
        assert c.interval_to(e) == M3

    def test_add_interval(self):
        c = Note('C')
        result = c + P5
        assert result.pitch == 7  # G

    def test_subtract_notes(self):
        c = Note('C')
        g = Note('G')
        interval = c.interval_to(g)
        assert interval == P5

    def test_from_pitch(self):
        n = Note.from_pitch(4)
        assert n.name == 'E'
        n_flat = Note.from_pitch(1, prefer_flat=True)
        assert n_flat.name == 'Db'

    def test_with_octave(self):
        n = Note('A', 4)
        assert n.octave == 4
        assert n.midi() == 69
        assert abs(n.frequency() - 440.0) < 0.01

    def test_midi(self):
        # Middle C = C4 = MIDI 60
        assert Note('C', 4).midi() == 60
        assert Note('A', 4).midi() == 69

    def test_frequency(self):
        assert Note('A', 4).frequency() == 440.0
        # C4 should be ~261.63
        assert abs(Note('C', 4).frequency() - 261.63) < 0.01

    def test_no_octave_midi_none(self):
        assert Note('C').midi() is None
        assert Note('C').frequency() is None

    def test_unknown_note_raises(self):
        with pytest.raises(ValueError):
            Note('X')

    def test_hash(self):
        assert hash(Note('C#')) == hash(Note('Db'))
        s = {Note('C'), Note('C#'), Note('Db')}
        assert len(s) == 2  # C and C#/Db

    def test_str(self):
        assert str(Note('C')) == 'C'
        assert str(Note('A', 4)) == 'A4'


class TestInterval:
    def test_create(self):
        i = Interval(7)
        assert i.semitones == 7
        assert i.name == 'P5'

    def test_from_name(self):
        assert Interval.from_name('P5').semitones == 7
        assert Interval.from_name('m3').semitones == 3

    def test_long_name(self):
        assert Interval(7).long_name == 'Perfect 5th'
        assert Interval(4).long_name == 'Major 3rd'

    def test_equality(self):
        assert Interval(7) == Interval(7)
        assert Interval(3) != Interval(4)

    def test_add(self):
        result = m3 + M3  # minor 3rd + major 3rd = minor 6th (3+4=7 semitones -> P5... wait)
        # Actually m3(3) + M3(4) = 7 semitones = P5
        assert result == P5

    def test_wraps(self):
        # 13 semitones wraps to 1
        assert Interval(13).semitones == 1

    def test_degree_label(self):
        assert P1.degree_label == '1'
        assert m3.degree_label == 'b3'
        assert P5.degree_label == '5'

    def test_unknown_name_raises(self):
        with pytest.raises(ValueError):
            Interval.from_name('X9')
