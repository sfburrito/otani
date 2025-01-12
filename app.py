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

# Initialize database tables
with app.app_context():
    app.logger.info("Creating database tables...")
    try:
        db.create_all()
        app.logger.info("Database tables created successfully!")
        
        # Verify tables exist
        engine = db.get_engine()
        inspector = db.inspect(engine)
        tables = inspector.get_table_names()
        app.logger.info(f"Found tables: {tables}")
        
        if 'user_preferences' not in tables:
            app.logger.error("user_preferences table was not created!")
        
    except Exception as e:
        app.logger.error(f"Error creating database tables: {str(e)}")
        app.logger.error(traceback.format_exc())

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
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    investment_stages = db.Column(db.String(500))
    industry_sectors = db.Column(db.String(500))
    geographic_focus = db.Column(db.String(500))
    investment_sizes = db.Column(db.String(500))
    additional_preferences = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
        app.logger.info(f'User {current_user.email} accessed dashboard')
        app.logger.debug('Fetching companies...')
        companies = Company.query.filter_by(user_id=current_user.id).all()
        app.logger.debug(f'Found {len(companies)} companies')
        
        # Get user preferences
        app.logger.debug('Fetching user preferences...')
        preferences = current_user.preferences
        app.logger.debug(f'Preferences object: {preferences}')
        
        if preferences:
            app.logger.debug(f'Raw preferences data - stages: {preferences.investment_stages}, focus: {preferences.geographic_focus}, additional: {preferences.additional_preferences}')
            investment_stages = preferences.investment_stages.split(',') if preferences.investment_stages else []
            industry_sectors = preferences.industry_sectors.split(',') if preferences.industry_sectors else []
            geographic_focus = preferences.geographic_focus.split(',') if preferences.geographic_focus else []
            investment_sizes = preferences.investment_sizes.split(',') if preferences.investment_sizes else []
            additional_preferences = preferences.additional_preferences or ''
        else:
            app.logger.debug('No preferences found, using defaults')
            investment_stages = []
            industry_sectors = []
            geographic_focus = []
            investment_sizes = []
            additional_preferences = ''
        
        app.logger.debug(f'Processed preferences - stages: {investment_stages}, focus: {geographic_focus}, additional: {additional_preferences}')
        
        app.logger.debug('Rendering dashboard template...')
        return render_template('dashboard.html', 
                             companies=companies,
                             investment_stages=investment_stages,
                             industry_sectors=industry_sectors,
                             geographic_focus=geographic_focus,
                             investment_sizes=investment_sizes,
                             additional_preferences=additional_preferences)
    except Exception as e:
        app.logger.error(f'Error in dashboard route: {str(e)}')
        app.logger.error('Full traceback:')
        app.logger.error(traceback.format_exc())
        return render_template('500.html'), 500

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
    app.logger.info('=== Getting Preferences ===')
    app.logger.info(f'User ID: {current_user.id}')
    
    preferences = current_user.preferences
    app.logger.info(f'Raw preferences object: {preferences.__dict__ if preferences else None}')
    
    if not preferences:
        app.logger.info('No preferences found, returning defaults')
        return {
            'investment_stages': [],
            'industry_sectors': [],
            'geographic_focus': [],
            'investment_sizes': [],
            'additional_preferences': ''
        }
    
    result = {
        'investment_stages': preferences.investment_stages.split(',') if preferences.investment_stages else [],
        'industry_sectors': preferences.industry_sectors.split(',') if preferences.industry_sectors else [],
        'geographic_focus': preferences.geographic_focus.split(',') if preferences.geographic_focus else [],
        'investment_sizes': preferences.investment_sizes.split(',') if preferences.investment_sizes else [],
        'additional_preferences': preferences.additional_preferences or ''
    }
    
    app.logger.info('=== Returning Preferences ===')
    app.logger.info(f'Result: {result}')
    return result

@app.route('/api/preferences', methods=['POST'])
@login_required
def save_preferences():
    try:
        app.logger.info('\n=== Saving Preferences ===')
        app.logger.info(f'User ID: {current_user.id}')
        
        # Log raw request data
        app.logger.info(f'Raw request data: {request.data}')
        app.logger.info(f'Request content type: {request.content_type}')
        
        data = request.get_json()
        app.logger.info(f'Parsed JSON data: {data}')
        
        # Validate data structure
        required_fields = ['investment_stages', 'industry_sectors', 'geographic_focus', 'investment_sizes']
        for field in required_fields:
            if field not in data:
                app.logger.error(f'Missing required field: {field}')
                return {'error': f'Missing required field: {field}'}, 400
            if not isinstance(data[field], list):
                app.logger.error(f'Field {field} must be a list, got {type(data[field])}')
                return {'error': f'Field {field} must be a list'}, 400
        
        preferences = current_user.preferences
        app.logger.info(f'Current preferences before update: {preferences.__dict__ if preferences else None}')
        
        if not preferences:
            app.logger.info('Creating new preferences object')
            preferences = UserPreferences(user_id=current_user.id)
            db.session.add(preferences)
        
        # Log each field being updated
        app.logger.info('=== Updating Fields ===')
        for field in required_fields:
            old_value = getattr(preferences, field, None)
            new_value = ','.join(data.get(field, []))
            app.logger.info(f'{field}:')
            app.logger.info(f'  Old: {old_value}')
            app.logger.info(f'  New: {new_value}')
            setattr(preferences, field, new_value)
        
        # Handle additional preferences
        old_additional = getattr(preferences, 'additional_preferences', None)
        new_additional = data.get('additional_preferences', '')
        app.logger.info('additional_preferences:')
        app.logger.info(f'  Old: {old_additional}')
        app.logger.info(f'  New: {new_additional}')
        preferences.additional_preferences = new_additional
        
        app.logger.info('=== Updated Object ===')
        app.logger.info(f'Updated preferences: {preferences.__dict__}')
        
        # Commit changes
        try:
            db.session.commit()
            app.logger.info('Successfully committed to database')
        except Exception as commit_error:
            app.logger.error(f'Error during commit: {str(commit_error)}')
            db.session.rollback()
            raise
        
        # Verify the changes were saved
        db.session.refresh(preferences)
        app.logger.info('=== Verification ===')
        app.logger.info(f'Preferences after refresh: {preferences.__dict__}')
        
        return {'message': 'Preferences saved successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error('=== Error Saving Preferences ===')
        app.logger.error(f'Error type: {type(e).__name__}')
        app.logger.error(f'Error message: {str(e)}')
        app.logger.error(f'Traceback: {traceback.format_exc()}')
        return {'error': 'Failed to save preferences'}, 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    app.logger.info(f'Serving static file: {filename}')
    return send_from_directory('static', filename)

@app.errorhandler(404)
def not_found_error(error):
    app.logger.error(f'Page not found: {request.url}')
    app.logger.error(f'Method: {request.method}')
    app.logger.error(f'Headers: {dict(request.headers)}')
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Server Error: {error}')
    app.logger.error('Full error context:')
    app.logger.error(f'URL: {request.url}')
    app.logger.error(f'Method: {request.method}')
    app.logger.error(f'Headers: {dict(request.headers)}')
    if request.is_json:
        app.logger.error(f'JSON Data: {request.get_json()}')
    app.logger.error('Traceback:')
    app.logger.error(traceback.format_exc())
    db.session.rollback()
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(debug=True)
