from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, init, migrate

# Import your app
from app import app, db

# Initialize migrations
with app.app_context():
    migrate = Migrate(app, db)
    init()  # This creates the migrations directory
    migrate()  # This creates the first migration
