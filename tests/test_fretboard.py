"""Tests for theory.fretboard module."""

import pytest
from theory.notes import Note
from theory.scales import get_scale
from theory.chords import Chord
from theory.fretboard import Fretboard, Tuning, TUNINGS, get_tuning, all_tuning_names


class TestTuning:
    def test_standard(self):
        t = TUNINGS['standard']
        names = [n.name for n in t.string_notes]
        assert names == ['E', 'A', 'D', 'G', 'B', 'E']

    def test_d_standard(self):
        t = TUNINGS['d_standard']
        names = [n.name for n in t.string_notes]
        assert names == ['D', 'G', 'C', 'F', 'A', 'D']

    def test_drop_c(self):
        t = TUNINGS['drop_c']
        names = [n.name for n in t.string_notes]
        assert names == ['C', 'G', 'C', 'F', 'A', 'D']

    def test_c_standard(self):
        t = TUNINGS['c_standard']
        names = [n.name for n in t.string_notes]
        assert names == ['C', 'F', 'Bb', 'Eb', 'G', 'C']

    def test_num_strings(self):
        assert TUNINGS['standard'].num_strings == 6

    def test_custom_tuning(self):
        t = Tuning('Custom', ['D', 'A', 'D', 'F#', 'A', 'D'], [38, 45, 50, 54, 57, 62])
        assert t.num_strings == 6
        assert t.string_notes[0].name == 'D'

    def test_get_tuning(self):
        t = get_tuning('d_standard')
        assert t.name == 'D Standard'

    def test_unknown_tuning(self):
        with pytest.raises(ValueError):
            get_tuning('nonexistent')


class TestFretboard:
    def test_note_at_open(self):
        fb = Fretboard('standard')
        assert fb.note_at(0, 0).pitch == Note('E').pitch  # Low E
        assert fb.note_at(5, 0).pitch == Note('E').pitch  # High E

    def test_note_at_fret(self):
        fb = Fretboard('standard')
        # 5th fret of low E = A
        assert fb.note_at(0, 5).pitch == Note('A').pitch
        # 12th fret of any string = same note as open
        assert fb.note_at(0, 12).pitch == fb.note_at(0, 0).pitch

    def test_d_standard_open(self):
        fb = Fretboard('d_standard')
        assert fb.note_at(0, 0).pitch == Note('D').pitch

    def test_find_note(self):
        fb = Fretboard('standard', num_frets=12)
        positions = fb.find_note('A')
        # A appears on every string within 12 frets
        assert len(positions) > 0
        for p in positions:
            assert p.note.pitch == Note('A').pitch

    def test_map_scale(self):
        fb = Fretboard('standard', num_frets=4)
        scale = get_scale('major')
        positions = fb.map_scale(scale, 'C')
        assert len(positions) > 0
        # All positions should be in C major
        c_major_pitches = {n.pitch for n in scale.notes('C')}
        for p in positions:
            assert p.note.pitch in c_major_pitches
        # Root should be labeled '1'
        roots = [p for p in positions if p.label == '1']
        assert len(roots) > 0
        assert all(r.note.pitch == 0 for r in roots)

    def test_map_chord(self):
        fb = Fretboard('standard', num_frets=4)
        chord = Chord('C', 'maj7')
        positions = fb.map_chord(chord)
        assert len(positions) > 0
        chord_pitches = chord.pitch_classes()
        for p in positions:
            assert p.note.pitch in chord_pitches

    def test_fretposition_to_dict(self):
        fb = Fretboard('standard')
        positions = fb.find_note('C')
        d = positions[0].to_dict()
        assert 'string' in d
        assert 'fret' in d
        assert 'note' in d
        assert d['pitch'] == 0

    def test_all_notes(self):
        fb = Fretboard('standard', num_frets=12)
        all_notes = fb.all_notes()
        assert len(all_notes) == 6  # 6 strings
        assert len(all_notes[0]) == 13  # 0-12 frets

    def test_tuning_string_lookup(self):
        fb = Fretboard('standard')
        assert fb.tuning.name == 'Standard'

    def test_unknown_tuning_string(self):
        with pytest.raises(ValueError):
            Fretboard('nonexistent')

    def test_all_tuning_names(self):
        names = all_tuning_names()
        assert 'd_standard' in names
        assert 'drop_c' in names
        assert 'c_standard' in names
