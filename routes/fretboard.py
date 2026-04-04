"""Fretboard visualization routes."""

from flask import Blueprint, render_template, request, jsonify

from theory.fretboard import Fretboard, TUNINGS, all_tuning_names
from theory.scales import get_scale, all_scale_names
from theory.chords import Chord, all_chord_type_symbols
from theory.notes import Note, SHARP_NAMES

bp = Blueprint('fretboard', __name__)


@bp.route('/')
def index():
    return render_template(
        'fretboard.html',
        tunings=TUNINGS,
        tuning_names=all_tuning_names(),
        scale_names=all_scale_names(),
        chord_types=all_chord_type_symbols(),
        note_names=SHARP_NAMES,
    )


@bp.route('/api/fretboard')
def fretboard_data():
    """Return fretboard position data as JSON.

    Query params:
        tuning: tuning key (default: d_standard)
        mode: 'scale' or 'chord'
        root: root note name (default: C)
        type: scale name or chord type symbol
        frets: number of frets (default: 24)
    """
    tuning_key = request.args.get('tuning', 'd_standard')
    mode = request.args.get('mode', 'scale')
    root_name = request.args.get('root', 'C')
    type_name = request.args.get('type', 'major')
    num_frets = int(request.args.get('frets', 24))

    try:
        fb = Fretboard(tuning_key, num_frets)
        root = Note(root_name)

        if mode == 'scale':
            scale = get_scale(type_name)
            positions = fb.map_scale(scale, root)
            info = {
                'name': scale.name,
                'formula': scale.formula(),
                'notes': [str(n) for n in scale.notes(root)],
            }
        elif mode == 'chord':
            chord = Chord(root, type_name)
            positions = fb.map_chord(chord)
            info = {
                'name': chord.symbol,
                'full_name': chord.full_name,
                'formula': chord.formula(),
                'notes': [str(n) for n in chord.notes()],
            }
        else:
            return jsonify({'error': f'Unknown mode: {mode}'}), 400

        # Build tuning info for the renderer
        tuning_info = {
            'name': fb.tuning.name,
            'strings': [n.name for n in fb.tuning.string_notes],
        }

        return jsonify({
            'positions': [p.to_dict() for p in positions],
            'info': info,
            'tuning': tuning_info,
            'num_frets': num_frets,
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
