"""Flask application entry point."""

from flask import Flask

from routes.fretboard import bp as fretboard_bp
from routes.progressions import bp as progressions_bp
from routes.reference import bp as reference_bp
from routes.ear_training import bp as ear_training_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(fretboard_bp)
    app.register_blueprint(progressions_bp)
    app.register_blueprint(reference_bp)
    app.register_blueprint(ear_training_bp)
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
