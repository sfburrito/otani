from flask import Flask, render_template, redirect, url_for, flash, request, send_from_directory
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
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
)

# Create Flask app
app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development
app.logger.setLevel(logging.INFO)

# Configure app
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///otani.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Define models
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))  # Increased from 128 to 256 for scrypt hashes
    companies = db.relationship('Company', backref='analyst', lazy=True)
    preferences = db.relationship('UserPreferences', backref='owner', lazy=True, uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    investment_stages = db.Column(db.String(500))  # Stored as JSON string
    geographic_focus = db.Column(db.String(500))  # Stored as JSON string
    additional_preferences = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('preferences', uselist=False))

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    industry = db.Column(db.String(100))
    description = db.Column(db.Text)
    stage = db.Column(db.String(50))
    website = db.Column(db.String(200))
    contact_email = db.Column(db.String(120))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')

            app.logger.info(f'Starting registration process for email: {email}')

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
            app.logger.info('Creating new user...')
            new_user = User(email=email)
            new_user.set_password(password)
            
            app.logger.info('Adding user to database...')
            db.session.add(new_user)
            db.session.commit()
            app.logger.info(f'User registered successfully: {email}')
            
            app.logger.info('Logging in new user...')
            login_user(new_user)
            flash('Account created successfully!')
            return redirect(url_for('dashboard'))

        except Exception as e:
            db.session.rollback()
            app.logger.error('Registration error:')
            app.logger.error(f'Error type: {type(e).__name__}')
            app.logger.error(f'Error message: {str(e)}')
            app.logger.error('Traceback:')
            app.logger.error(traceback.format_exc())
            flash('Error creating account. Please try again.')
            return redirect(url_for('register'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    error = None
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        else:
            error = 'Invalid email or password'
            flash(error)
    
    return render_template('login.html', error=error)

@app.route('/dashboard')
@login_required
def dashboard():
    try:
        companies = Company.query.filter_by(user_id=current_user.id).order_by(Company.created_at.desc()).all()
        return render_template('dashboard.html', companies=companies)
    except Exception as e:
        app.logger.error(f'Error in dashboard: {str(e)}')
        app.logger.error(traceback.format_exc())
        flash('Error loading dashboard')
        return redirect(url_for('index'))

@app.route('/logout')
@login_required
def logout():
    try:
        logout_user()
        return redirect(url_for('index'))
    except Exception as e:
        app.logger.error(f'Error during logout: {str(e)}')
        app.logger.error(traceback.format_exc())
        flash('Error during logout')
        return redirect(url_for('index'))

@app.route('/add_company', methods=['POST'])
@login_required
def add_company():
    try:
        app.logger.info(f'User {current_user.email} attempting to add new company')
        name = request.form.get('name')
        industry = request.form.get('industry')
        description = request.form.get('description')
        stage = request.form.get('stage')
        website = request.form.get('website')
        contact_email = request.form.get('contact_email')
        notes = request.form.get('notes')

        app.logger.debug(f'New company details - Name: {name}, Industry: {industry}, Stage: {stage}')

        company = Company(
            name=name,
            industry=industry,
            description=description,
            stage=stage,
            website=website,
            contact_email=contact_email,
            notes=notes,
            user_id=current_user.id
        )

        db.session.add(company)
        db.session.commit()
        app.logger.info(f'Successfully added new company {name} for user {current_user.email}')
        flash('Company added successfully!')
        return redirect(url_for('dashboard'))
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error adding company for user {current_user.email}: {str(e)}')
        app.logger.error(traceback.format_exc())
        flash('Error adding company. Please try again.')
        return redirect(url_for('dashboard'))

@app.route('/api/preferences', methods=['GET'])
@login_required
def get_preferences():
    preferences = current_user.preferences
    if not preferences:
        return {'investment_stages': [], 'geographic_focus': [], 'additional_preferences': ''}
    
    return {
        'investment_stages': preferences.investment_stages.split(',') if preferences.investment_stages else [],
        'geographic_focus': preferences.geographic_focus.split(',') if preferences.geographic_focus else [],
        'additional_preferences': preferences.additional_preferences or ''
    }

@app.route('/api/preferences', methods=['POST'])
@login_required
def save_preferences():
    data = request.get_json()
    
    preferences = current_user.preferences
    if not preferences:
        preferences = UserPreferences(user_id=current_user.id)
        db.session.add(preferences)
    
    preferences.investment_stages = ','.join(data.get('investment_stages', []))
    preferences.geographic_focus = ','.join(data.get('geographic_focus', []))
    preferences.additional_preferences = data.get('additional_preferences', '')
    
    try:
        db.session.commit()
        return {'message': 'Preferences saved successfully'}, 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error saving preferences: {str(e)}')
        return {'error': 'Failed to save preferences'}, 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    app.logger.info(f'Serving static file: {filename}')
    return send_from_directory('static', filename)

@app.errorhandler(404)
def not_found_error(error):
    app.logger.error(f'Page not found: {request.url}')
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    app.logger.error(f'Server Error: {error}')
    app.logger.error(traceback.format_exc())
    return render_template('500.html'), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
