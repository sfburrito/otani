from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask_migrate import Migrate
import json
import logging
import os
import uuid
import random
import sys
import traceback
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

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
if os.environ.get('DATABASE_URL'):
    # Handle Render Postgres database URL
    database_url = os.environ.get('DATABASE_URL')
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///otani.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Define models
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))  # Increased from 128 to 256 for scrypt hashes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    companies = db.relationship('Company', backref='analyst', lazy=True)
    preferences = db.relationship('UserPreferences', backref='owner', lazy=True, uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email
        }

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

    def to_dict(self):
        return {
            'investment_stages': json.loads(self.investment_stages) if self.investment_stages else [],
            'industry_sectors': json.loads(self.industry_sectors) if self.industry_sectors else [],
            'geographic_focus': json.loads(self.geographic_focus) if self.geographic_focus else [],
            'investment_sizes': json.loads(self.investment_sizes) if self.investment_sizes else [],
            'additional_preferences': self.additional_preferences
        }

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    industry = db.Column(db.String(50), nullable=False)
    stage = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(50), nullable=False)
    website = db.Column(db.String(200))
    email = db.Column(db.String(100))
    description = db.Column(db.Text)
    rating = db.Column(db.String(50))
    otani_rating = db.Column(db.String(1))  # A, B, C, or D
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def calculate_otani_rating(self, user_preferences):
        """Calculate Otani Rating based on matches with user preferences."""
        if not user_preferences:
            return 'D'  # Default rating if no preferences set
            
        matches = 0
        
        # Get user preferences lists (ensure they exist)
        industry_sectors = user_preferences.get('industry_sectors', [])
        investment_stages = user_preferences.get('investment_stages', [])
        geographic_focus = user_preferences.get('geographic_focus', [])
        
        # Normalize company values for comparison
        company_industry = self.industry.lower().replace('/', '_').replace(' ', '_')
        company_stage = self.stage.lower().replace(' ', '_')
        company_location = self.location.lower().replace(' ', '_')
        
        # Count matches
        if company_industry in industry_sectors:
            matches += 1
        if company_stage in investment_stages:
            matches += 1
        if company_location in geographic_focus:
            matches += 1
        
        # Assign rating based on matches
        rating_map = {3: 'A', 2: 'B', 1: 'C', 0: 'D'}
        return rating_map[matches]

    def to_dict(self):
        """Convert company to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'industry': self.industry,
            'stage': self.stage,
            'location': self.location,
            'website': self.website,
            'email': self.email,
            'description': self.description,
            'rating': self.rating,
            'otani_rating': self.otani_rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

def init_db():
    """Initialize the database."""
    try:
        app.logger.info('Creating database tables...')
        db.create_all()
        app.logger.info('Database tables created successfully!')
        
        # List all tables using SQLAlchemy inspector
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        app.logger.info('Found tables: %s', tables)

        # Initialize users
        users_to_init = [
            {
                'email': 'test@example.com',
                'password': 'password'
            },
            {
                'email': 'ttanaka@translinkcapital.com',
                'password': 'password'  # You should change this in production
            }
        ]

        for user_data in users_to_init:
            user = User.query.filter_by(email=user_data['email']).first()
            if not user:
                user = User(email=user_data['email'])
                user.set_password(user_data['password'])
                db.session.add(user)
                db.session.commit()  # Commit to get the user ID

                # Initialize preferences
                preferences = UserPreferences(
                    user_id=user.id,
                    investment_stages=json.dumps([]),
                    industry_sectors=json.dumps([]),
                    geographic_focus=json.dumps([]),
                    investment_sizes=json.dumps([]),
                    additional_preferences=''
                )
                db.session.add(preferences)
                db.session.commit()

                if user_data['email'] == 'test@example.com':
                    # Sample companies data
                    companies = [
                        {
                            'name': 'NeuraTech AI',
                            'industry': 'AI/ML',
                            'stage': 'Series B',
                            'website': 'https://neuratech.ai',
                            'email': 'contact@neuratech.ai',
                            'description': 'Developing advanced neural networks for enterprise decision making.',
                            'rating': 'A',
                            'location': 'North America'
                        },
                        {
                            'name': 'GreenFlow Energy',
                            'industry': 'Cleantech',
                            'stage': 'Series A',
                            'website': 'https://greenflow.energy',
                            'email': 'info@greenflow.energy',
                            'description': 'Revolutionary energy storage solutions for renewable power.',
                            'rating': 'B',
                            'location': 'Europe'
                        },
                        {
                            'name': 'CyberShield',
                            'industry': 'Cybersecurity',
                            'stage': 'Growth',
                            'website': 'https://cybershield.io',
                            'email': 'security@cybershield.io',
                            'description': 'Next-generation zero-trust security platform.',
                            'rating': 'A',
                            'location': 'North America'
                        },
                        {
                            'name': 'HealthAI Labs',
                            'industry': 'Healthcare',
                            'stage': 'Series C+',
                            'website': 'https://healthai.med',
                            'email': 'partnerships@healthai.med',
                            'description': 'AI-powered diagnostic tools for healthcare providers.',
                            'rating': 'A',
                            'location': 'Asia-Pacific'
                        },
                        {
                            'name': 'EduVerse',
                            'industry': 'EdTech',
                            'stage': 'Seed',
                            'website': 'https://eduverse.education',
                            'email': 'hello@eduverse.education',
                            'description': 'Virtual reality platform for immersive education.',
                            'rating': 'B',
                            'location': 'Europe'
                        },
                        {
                            'name': 'PayFlow',
                            'industry': 'Fintech',
                            'stage': 'Series B',
                            'website': 'https://payflow.finance',
                            'email': 'support@payflow.finance',
                            'description': 'Blockchain-based cross-border payment solution.',
                            'rating': 'B',
                            'location': 'Asia-Pacific'
                        },
                        {
                            'name': 'CloudStack Enterprise',
                            'industry': 'Enterprise',
                            'stage': 'Late Stage',
                            'website': 'https://cloudstack.tech',
                            'email': 'enterprise@cloudstack.tech',
                            'description': 'Enterprise-grade cloud infrastructure management.',
                            'rating': 'A',
                            'location': 'North America'
                        },
                        {
                            'name': 'GameVerse Studios',
                            'industry': 'Gaming',
                            'stage': 'Series A',
                            'website': 'https://gameverse.games',
                            'email': 'studio@gameverse.games',
                            'description': 'Web3 gaming platform with play-to-earn mechanics.',
                            'rating': 'C',
                            'location': 'Latin America'
                        },
                        {
                            'name': 'ShopSmart',
                            'industry': 'E-commerce',
                            'stage': 'Growth',
                            'website': 'https://shopsmart.market',
                            'email': 'retail@shopsmart.market',
                            'description': 'AI-powered personalized shopping experience platform.',
                            'rating': 'B',
                            'location': 'Middle East and Africa'
                        },
                        {
                            'name': 'SocialCommerce',
                            'industry': 'Consumer',
                            'stage': 'Series B',
                            'website': 'https://socialcommerce.app',
                            'email': 'hello@socialcommerce.app',
                            'description': 'Social media integrated e-commerce platform.',
                            'rating': 'A',
                            'location': 'Asia-Pacific'
                        }
                    ]
                    
                    app.logger.info(f'Creating dummy companies for user {user.id}')
                    
                    for company_data in companies:
                        company = Company(user_id=user.id, **company_data)
                        db.session.add(company)
                    
                    try:
                        db.session.commit()
                        app.logger.info('Successfully added test user and dummy companies')
                    except Exception as e:
                        db.session.rollback()
                        app.logger.error(f'Error adding test data: {str(e)}')
                        raise
        
        # Create user preferences if they don't exist
        if user and not user.preferences:
            preferences = UserPreferences(
                user_id=user.id,
                investment_stages=json.dumps([]),
                industry_sectors=json.dumps([]),
                geographic_focus=json.dumps([]),
                investment_sizes=json.dumps([]),
                additional_preferences='Looking for companies with strong IP and experienced founding teams.'
            )
            db.session.add(preferences)
            try:
                db.session.commit()
                app.logger.info('Successfully added user preferences')
            except Exception as e:
                db.session.rollback()
                app.logger.error(f'Error adding preferences: {str(e)}')
                raise

    except Exception as e:
        app.logger.error(f'Error during database initialization: {str(e)}')
        traceback.print_exc()
        raise

# Initialize database
with app.app_context():
    db.create_all()
    app.logger.info('Database tables created successfully!')
    
    # List all tables using SQLAlchemy inspector
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    app.logger.info('Found tables: %s', tables)

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
    """Dashboard route."""
    try:
        app.logger.info(f'Dashboard access: {current_user.email}')
        
        # Get user preferences
        preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
        app.logger.info(f'User preferences object: {preferences}')
        
        if not preferences:
            preferences = UserPreferences(
                user_id=current_user.id,
                investment_stages=json.dumps([]),
                industry_sectors=json.dumps([]),
                geographic_focus=json.dumps([]),
                investment_sizes=json.dumps([]),
                additional_preferences=''
            )
            db.session.add(preferences)
            db.session.commit()
        
        # Log raw values for debugging
        app.logger.info('Raw preferences values:')
        app.logger.info(f'investment_stages: {preferences.investment_stages}')
        app.logger.info(f'industry_sectors: {preferences.industry_sectors}')
        app.logger.info(f'geographic_focus: {preferences.geographic_focus}')
        app.logger.info(f'investment_sizes: {preferences.investment_sizes}')
        
        def parse_json_or_string(value):
            if not value:
                return []
            try:
                # Try to parse as JSON first
                return json.loads(value)
            except json.JSONDecodeError:
                # If it's a string, wrap it in a list
                return [value] if value else []
        
        # Get all companies for the current user and convert to dictionaries
        companies = Company.query.filter_by(user_id=current_user.id).all()
        companies_list = []
        for company in companies:
            company_dict = {
                'id': company.id,
                'name': company.name,
                'industry': company.industry,
                'stage': company.stage,
                'location': company.location,
                'website': company.website,
                'email': company.email,
                'description': company.description,
                'rating': company.rating,
                'otani_rating': company.otani_rating,
                'user_id': company.user_id
            }
            companies_list.append(company_dict)
        
        return render_template(
            'dashboard.html',
            companies=companies_list,
            preferences={
                'investment_stages': parse_json_or_string(preferences.investment_stages),
                'industry_sectors': parse_json_or_string(preferences.industry_sectors),
                'geographic_focus': parse_json_or_string(preferences.geographic_focus),
                'investment_sizes': parse_json_or_string(preferences.investment_sizes),
                'additional_preferences': preferences.additional_preferences
            }
        )
    except Exception as e:
        app.logger.error(f'Dashboard error: {str(e)}')
        app.logger.error('Full traceback:', exc_info=True)
        return redirect(url_for('index'))

@app.route('/api/companies', methods=['GET'])
@login_required
def get_companies():
    try:
        companies = Company.query.filter_by(user_id=current_user.id).all()
        return jsonify([company.to_dict() for company in companies]), 200
    except Exception as e:
        app.logger.error(f'Error getting companies: {str(e)}')
        return jsonify({'error': 'Failed to get companies'}), 500

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
    request_id = str(uuid.uuid4())[:8]  # Generate a unique ID for this request
    app.logger.info(f"[{request_id}] User {current_user.email} attempting to add new company")
    try:
        # Log raw request data
        app.logger.debug(f"[{request_id}] Raw request data: {request.get_data()}")
        app.logger.debug(f"[{request_id}] Request headers: {dict(request.headers)}")
        
        # Get JSON data
        data = request.get_json()
        app.logger.info(f"[{request_id}] Parsed request data: {data}")
        
        if not data:
            app.logger.error(f"[{request_id}] No JSON data received")
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['name', 'industry', 'stage', 'location']
        for field in required_fields:
            if not data.get(field):
                app.logger.error(f"[{request_id}] Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Check for duplicate company within last 5 seconds
        five_seconds_ago = datetime.utcnow() - timedelta(seconds=5)
        app.logger.debug(f"[{request_id}] Checking for duplicates since {five_seconds_ago}")
        
        recent_company = Company.query.filter_by(
            user_id=current_user.id,
            name=data['name']
        ).filter(Company.created_at >= five_seconds_ago).first()

        if recent_company:
            app.logger.warning(f"[{request_id}] Duplicate submission detected for company {data['name']}")
            app.logger.debug(f"[{request_id}] Found recent company: {recent_company.to_dict()}")
            return jsonify({
                "message": "Company already added",
                "company": recent_company.to_dict()
            }), 200

        app.logger.debug(f"[{request_id}] No recent duplicate found, creating new company")

        # Create new company
        new_company = Company(
            name=data['name'],
            industry=data['industry'],
            stage=data['stage'],
            location=data['location'],
            website=data.get('website', ''),
            email=data.get('email', ''),
            description=data.get('description', ''),
            rating=data.get('rating', ''),
            user_id=current_user.id
        )

        # Get user preferences and calculate Otani Rating
        preferences = current_user.preferences.to_dict() if current_user.preferences else {}
        new_company.otani_rating = new_company.calculate_otani_rating(preferences)

        # Add to database
        db.session.add(new_company)
        db.session.commit()
        
        app.logger.info(f"[{request_id}] Successfully added new company {data['name']} for user {current_user.email}")
        app.logger.debug(f"[{request_id}] New company details: {new_company.to_dict()}")
        
        # Return success response with company data
        return jsonify({
            "message": "Company added successfully",
            "company": new_company.to_dict()
        }), 200

    except Exception as e:
        app.logger.error(f"[{request_id}] Error adding company: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/get_preferences', methods=['GET'])
@login_required
def get_preferences():
    """Get user preferences."""
    try:
        app.logger.info("=== Getting Preferences ===")
        app.logger.info(f"User ID: {current_user.id}")
        
        preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
        
        if not preferences:
            app.logger.info("No preferences found, creating default preferences")
            preferences = UserPreferences(
                user_id=current_user.id,
                investment_stages=json.dumps([]),
                industry_sectors=json.dumps([]),
                geographic_focus=json.dumps([]),
                investment_sizes=json.dumps([]),
                additional_preferences=''
            )
            db.session.add(preferences)
            db.session.commit()
        
        app.logger.info(f"Raw preferences object: {preferences.__dict__}")
        
        def parse_json_or_string(value):
            if not value:
                return []
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return [value] if value else []
        
        preferences_dict = {
            'investment_stages': parse_json_or_string(preferences.investment_stages),
            'industry_sectors': parse_json_or_string(preferences.industry_sectors),
            'geographic_focus': parse_json_or_string(preferences.geographic_focus),
            'investment_sizes': parse_json_or_string(preferences.investment_sizes),
            'additional_preferences': preferences.additional_preferences or ''
        }
        
        app.logger.info(f"Returning preferences: {preferences_dict}")
        return jsonify(preferences_dict)
        
    except Exception as e:
        app.logger.error(f"Error getting preferences: {str(e)}")
        app.logger.error("Full traceback:", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/save_preferences', methods=['POST'])
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
        
        # Delete existing preferences
        if current_user.preferences:
            app.logger.info('Deleting existing preferences')
            db.session.delete(current_user.preferences)
            db.session.commit()
        
        # Create new preferences
        app.logger.info('Creating new preferences object')
        preferences = UserPreferences(
            user_id=current_user.id,
            investment_stages=json.dumps(data['investment_stages']),
            industry_sectors=json.dumps(data['industry_sectors']),
            geographic_focus=json.dumps(data['geographic_focus']),
            investment_sizes=json.dumps(data['investment_sizes']),
            additional_preferences=data.get('additional_preferences', '')
        )
        
        app.logger.info('=== New Preferences Object ===')
        app.logger.info(f'Object dict: {preferences.__dict__}')
        
        # Add and commit
        db.session.add(preferences)
        db.session.commit()
        app.logger.info('Successfully committed to database')
        
        # Verify the changes were saved
        db.session.refresh(preferences)
        app.logger.info('=== Verification ===')
        app.logger.info(f'Preferences after refresh: {preferences.__dict__}')
        
        # Query the database directly to verify
        with db.engine.connect() as conn:
            result = conn.execute(text(f"SELECT * FROM user_preferences WHERE user_id = {current_user.id}")).mappings().first()
            app.logger.info('=== Database Query Verification ===')
            app.logger.info(f'Raw database row: {dict(result) if result else None}')
        
        return {'message': 'Preferences saved successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error('=== Error Saving Preferences ===')
        app.logger.error(f'Error type: {type(e).__name__}')
        app.logger.error(f'Error message: {str(e)}')
        app.logger.error(f'Traceback: {traceback.format_exc()}')
        return {'error': 'Failed to save preferences'}, 500

@app.route('/delete_company/<int:company_id>', methods=['DELETE'])
@login_required
def delete_company(company_id):
    try:
        company = Company.query.filter_by(id=company_id, user_id=current_user.id).first()
        
        if not company:
            return {'error': 'Company not found'}, 404
            
        db.session.delete(company)
        db.session.commit()
        
        return {'message': 'Company deleted successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error deleting company: {str(e)}')
        return {'error': 'Failed to delete company'}, 500

@app.route('/update_company_locations', methods=['POST'])
@login_required
def update_company_locations():
    if current_user.email != 'ttanaka@translinkcapital.com':
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        locations = [
            'San Francisco, CA', 'New York, NY', 'Boston, MA', 'Seattle, WA',
            'Los Angeles, CA', 'Austin, TX', 'Chicago, IL', 'Miami, FL',
            'Denver, CO', 'Portland, OR', 'Washington, DC', 'San Diego, CA',
            'Houston, TX', 'Atlanta, GA', 'Phoenix, AZ', 'Dallas, TX'
        ]
        
        companies = Company.query.filter_by(user_id=current_user.id).all()
        for company in companies:
            if not company.location:
                company.location = random.choice(locations)
        
        db.session.commit()
        return jsonify({"message": "Company locations updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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

def update_company_ratings(user_id):
    """Update Otani Ratings for all companies of a user."""
    user = User.query.get(user_id)
    if not user:
        return
    
    # Get user preferences
    preferences = json.loads(user.preferences) if user.preferences else {}
    
    # Update ratings for all companies
    companies = Company.query.filter_by(user_id=user_id).all()
    for company in companies:
        company.otani_rating = company.calculate_otani_rating(preferences)
    
    db.session.commit()

@app.route('/update_preferences', methods=['POST'])
@login_required
def update_preferences():
    try:
        data = request.get_json()
        
        # Update user preferences
        current_user.preferences = json.dumps({
            'investment_stages': data.get('investment_stages', []),
            'industry_sectors': data.get('industry_sectors', []),
            'geographic_focus': data.get('geographic_focus', []),
            'investment_sizes': data.get('investment_sizes', []),
            'additional_preferences': data.get('additional_preferences', '')
        })
        
        db.session.commit()
        
        # Update Otani Ratings for all companies
        update_company_ratings(current_user.id)
        
        return jsonify({'message': 'Preferences updated successfully'})
    except Exception as e:
        print(f"Error updating preferences: {str(e)}")
        return jsonify({'error': 'Failed to update preferences'}), 500

if __name__ == '__main__':
    app.run(debug=True)
