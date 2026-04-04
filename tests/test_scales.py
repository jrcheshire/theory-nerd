"""Tests for theory.scales module."""

import pytest
from theory.notes import Note
from theory.scales import Scale, SCALES, get_scale, all_scale_names


class TestScale:
    def test_major_scale_notes(self):
        scale = get_scale('major')
        notes = scale.notes('C')
        pitches = [n.pitch for n in notes]
        assert pitches == [0, 2, 4, 5, 7, 9, 11]

    def test_major_scale_formula(self):
        scale = get_scale('major')
        assert scale.formula() == '1 2 3 4 5 6 7'

    def test_natural_minor_formula(self):
        scale = get_scale('natural_minor')
        assert scale.formula() == '1 2 b3 4 5 b6 b7'

    def test_pentatonic_minor(self):
        scale = get_scale('pentatonic_minor')
        notes = scale.notes('A')
        pitches = [n.pitch for n in notes]
        # A minor pentatonic: A C D E G -> 9 0 2 4 7
        assert pitches == [9, 0, 2, 4, 7]

    def test_blues_scale(self):
        scale = get_scale('blues')
        notes = scale.notes('A')
        pitches = [n.pitch for n in notes]
        # A blues: A C D Eb E G -> 9 0 2 3 4 7
        assert pitches == [9, 0, 2, 3, 4, 7]

    def test_degree(self):
        scale = get_scale('major')
        # 3rd degree of C major = E
        assert scale.degree(3, 'C').pitch == 4

    def test_contains_pitch(self):
        scale = get_scale('major')
        assert scale.contains_pitch(0)   # 1
        assert scale.contains_pitch(4)   # 3
        assert not scale.contains_pitch(1)  # not in C major

    def test_mode_dorian(self):
        major = get_scale('major')
        dorian = major.mode(2)
        assert dorian.name == 'Dorian'
        assert dorian.formula() == '1 2 b3 4 5 6 b7'

    def test_mode_mixolydian(self):
        major = get_scale('major')
        mixo = major.mode(5)
        assert mixo.name == 'Mixolydian'
        assert mixo.formula() == '1 2 3 4 5 6 b7'

    def test_mode_locrian(self):
        major = get_scale('major')
        locrian = major.mode(7)
        assert locrian.name == 'Locrian'
        assert locrian.formula() == '1 b2 b3 4 b5 b6 b7'

    def test_all_modes_count(self):
        major = get_scale('major')
        modes = major.all_modes()
        assert len(modes) == 7

    def test_melodic_minor_modes(self):
        mm = get_scale('melodic_minor')
        altered = mm.mode(7)
        assert altered.name == 'Altered'

        lydian_dom = mm.mode(4)
        assert lydian_dom.name == 'Lydian Dominant'

    def test_get_scale_case_insensitive(self):
        s1 = get_scale('Major')
        s2 = get_scale('MAJOR')
        assert s1.intervals == s2.intervals

    def test_get_scale_spaces(self):
        s = get_scale('harmonic minor')
        assert s.name == 'Harmonic Minor'

    def test_unknown_scale_raises(self):
        with pytest.raises(ValueError):
            get_scale('nonexistent_scale')

    def test_all_scale_names(self):
        names = all_scale_names()
        assert 'major' in names
        assert 'dorian' in names
        assert len(names) > 10

    def test_individual_mode_lookup(self):
        """Modes should be available as top-level scale names."""
        dorian = get_scale('dorian')
        assert dorian.formula() == '1 2 b3 4 5 6 b7'

        phrygian = get_scale('phrygian')
        assert phrygian.formula() == '1 b2 b3 4 5 b6 b7'
