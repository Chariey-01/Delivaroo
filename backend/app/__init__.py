from flask import Flask

from app.config import Config
from app.extensions import jwt,migrate,db

def create_app(config_class=Config):
  # create and configure the flask application

  app = Flask(__name__)

  app.config.from_object(config_class)

  config_class.validate()

  db.init_app(app)
  migrate.init_app(app,db)
  jwt.init_app(app)

  return app