from flask import Flask

from app.config import config_map
from app.extensions import db, migrate, jwt, cors


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)

    # Blueprints will be registered here as resources are built
    # e.g. from app.resources.parcel import parcel_bp
    #      app.register_blueprint(parcel_bp)

    return app