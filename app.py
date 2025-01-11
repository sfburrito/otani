from flask import Flask, render_template, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import logging
import sys
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
)

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

# Log basic configuration information
app.logger.info('Starting application...')
app.logger.info(f'Python version: {sys.version}')

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev')
database_url = os.environ.get('DATABASE_URL', 'sqlite:///otani.db')
app.logger.info(f'Initial DATABASE_URL: {database_url}')

# Fix for SQLAlchemy URI format for PostgreSQL on Render
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.logger.info(f'Modified DATABASE_URL: {database_url}')

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    db = SQLAlchemy(app)
    app.logger.info('SQLAlchemy initialized successfully')
except Exception as e:
    app.logger.error(f'Error initializing SQLAlchemy: {str(e)}')
    app.logger.error(traceback.format_exc())
    raise

login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Create all database tables
try:
    with app.app_context():
        app.logger.info('Attempting to create database tables...')
        db.create_all()
        app.logger.info('Database tables created successfully')
except Exception as e:
    app.logger.error(f'Error creating database tables: {str(e)}')
    app.logger.error(traceback.format_exc())
    raise

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    companies = db.relationship('Company', backref='analyst', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    industry = db.Column(db.String(100))
    description = db.Column(db.Text)
    stage = db.Column(db.String(50))
    website = db.Column(db.String(200))
    contact_email = db.Column(db.String(120))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

@login_manager.user_loader
def load_user(id):
    try:
        return User.query.get(int(id))
    except Exception as e:
        app.logger.error(f'Error loading user: {str(e)}')
        app.logger.error(traceback.format_exc())
        return None

@app.route('/')
def index():
    try:
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        return render_template('index.html')
    except Exception as e:
        app.logger.error(f'Error rendering index page: {str(e)}')
        app.logger.error(traceback.format_exc())
        return 'An unexpected error occurred. Please try again.'

@app.route('/dashboard')
@login_required
def dashboard():
    try:
        companies = Company.query.filter_by(user_id=current_user.id).order_by(Company.created_at.desc()).all()
        return render_template('dashboard.html', companies=companies)
    except Exception as e:
        app.logger.error(f'Error rendering dashboard page: {str(e)}')
        app.logger.error(traceback.format_exc())
        return 'An unexpected error occurred. Please try again.'

@app.route('/login', methods=['GET', 'POST'])
def login():
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            app.logger.info(f'Login attempt for email: {email}')

            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                app.logger.info(f'Login successful for email: {email}')
                login_user(user)
                return redirect(url_for('dashboard'))
            app.logger.warning(f'Login failed for email: {email}')
            flash('Invalid email or password')
        return render_template('login.html')
    except Exception as e:
        app.logger.error(f'Error during login: {str(e)}')
        app.logger.error(traceback.format_exc())
        flash('An unexpected error occurred. Please try again.')
        return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')

            app.logger.info(f'Registration attempt for email: {email}')

            # Check if user already exists
            user_exists = User.query.filter_by(email=email).first()
            if user_exists:
                app.logger.warning(f'Registration failed: Email already exists: {email}')
                flash('Email already registered')
                return redirect(url_for('register'))

            # Validate password match
            if password != confirm_password:
                app.logger.warning('Registration failed: Passwords do not match')
                flash('Passwords do not match')
                return redirect(url_for('register'))

            # Create new user
            new_user = User(email=email)
            new_user.set_password(password)
            
            try:
                db.session.add(new_user)
                db.session.commit()
                app.logger.info(f'User registered successfully: {email}')
                login_user(new_user)
                flash('Account created successfully!')
                return redirect(url_for('dashboard'))
            except Exception as e:
                db.session.rollback()
                app.logger.error(f'Database error during registration: {str(e)}')
                app.logger.error(traceback.format_exc())
                flash('Error creating account. Please try again.')
                return redirect(url_for('register'))

        return render_template('register.html')
    except Exception as e:
        app.logger.error(f'Unexpected error during registration: {str(e)}')
        app.logger.error(traceback.format_exc())
        flash('An unexpected error occurred. Please try again.')
        return redirect(url_for('register'))

@app.route('/logout')
@login_required
def logout():
    try:
        logout_user()
        return redirect(url_for('index'))
    except Exception as e:
        app.logger.error(f'Error during logout: {str(e)}')
        app.logger.error(traceback.format_exc())
        flash('An unexpected error occurred. Please try again.')
        return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
