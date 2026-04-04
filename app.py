"""Flask application entry point."""

from flask import Flask

from routes.fretboard import bp as fretboard_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(fretboard_bp)
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
