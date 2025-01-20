"""
Database models for the Otani application.
This module defines the database schema and models using SQLAlchemy ORM.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """
    User model representing registered users in the system.
    
    Attributes:
        id (int): Primary key for the user
        email (str): User's email address, must be unique
        password_hash (str): Hashed version of the user's password
    """
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        """Convert user object to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'email': self.email
        }

class InvestorPreferences(db.Model):
    """
    InvestorPreferences model representing user investment preferences.
    
    Attributes:
        id (int): Primary key
        user_id (int): Foreign key to users table
        industry (array): List of preferred industries
        stage (array): List of preferred investment stages
        location (array): List of preferred locations
        investment_amount (array): List of preferred investment amounts
        additional_info (text): Additional preferences information
    """
    
    __tablename__ = 'preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    industry = db.Column(db.ARRAY(db.String(100)))
    stage = db.Column(db.ARRAY(db.String(50)))
    location = db.Column(db.ARRAY(db.String(100)))
    investment_amount = db.Column(db.ARRAY(db.String(100)))
    additional_info = db.Column(db.Text)
    
    # Relationship with User model
    user = db.relationship('User', backref=db.backref('preferences', uselist=False))
    
    def to_dict(self):
        """Convert preferences to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'industry': self.industry,
            'stage': self.stage,
            'location': self.location,
            'investment_amount': self.investment_amount,
            'additional_info': self.additional_info
        }

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    company_name = db.Column(db.String(255))
    industry = db.Column(db.String(100))
    stage = db.Column(db.String(50))
    location = db.Column(db.String(100))
    your_rating = db.Column(db.String(1))
    
    user = db.relationship('User', backref=db.backref('companies', lazy=True))

    def to_dict(self):
        """Convert company object to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'industry': self.industry,
            'stage': self.stage,
            'location': self.location,
            'your_rating': self.your_rating
        }
