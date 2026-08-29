from flask import Flask
from app.config import Config
from app.extensions import db, jwt, migrate
from app import models
from app.resources import init_resources


def create_app(config_class=Config):
    """Create and configure the Flask application."""

    app = Flask(__name__)

    app.config.from_object(config_class)

    config_class.validate()

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    init_resources(app)

    return app
