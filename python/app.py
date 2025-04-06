"""
Otani Web Application
--------------------
Main application module that defines routes and handles user authentication.
"""

from flask import Flask, request, jsonify, send_from_directory, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, InvestorPreferences, Company
import logging
import os

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:UBCsauder308!@localhost:5432/otani_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(24)

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = '/'  # Redirect to login page if not authenticated

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID."""
    return User.query.get(int(user_id))

@app.after_request
def after_request(response):
    """Add CORS headers to all responses."""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response

@app.route('/')
def index():
    """Serve the main login page."""
    return send_from_directory('../html', 'login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Serve the main dashboard page."""
    return send_from_directory('../', 'index.html')

@app.route('/html/<path:filename>')
def serve_html(filename):
    """Serve HTML files from the html directory."""
    return send_from_directory('../html', filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files from the css directory."""
    return send_from_directory('../css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files from the js directory."""
    return send_from_directory('../js', filename)

@app.route('/api/register', methods=['POST'])
def register():
    """
    Handle user registration.
    
    Expects JSON with:
        - email: user's email address
        - password: user's password
    
    Returns:
        JSON response indicating success or failure
    """
    logger.debug('Register endpoint hit')
    
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': 'Email already registered'}), 400
            
        # Create new user
        user = User()
        user.email = data['email']
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Log the user in after registration
        login_user(user)
        
        return jsonify({'success': True, 'message': 'Registration successful'})
    except Exception as e:
        logger.error(f'Error during registration: {str(e)}')
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/login', methods=['POST'])
def login():
    """
    Handle user login.
    
    Expects JSON with:
        - email: user's email address
        - password: user's password
    
    Returns:
        JSON response with user data if successful, error message if not
    """
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            login_user(user)
            return jsonify({'success': True, 'user': user.to_dict()})
        else:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            
    except Exception as e:
        logger.error(f'Error during login: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/logout')
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/preferences', methods=['POST'])
@login_required
def save_preferences():
    """
    Save or update investor preferences for the current user.
    
    Expects JSON with:
        - industry: list of selected industries
        - stage: list of selected stages
        - location: list of selected locations
        - investment_amount: list of selected investment amounts
        - additional_info: additional preferences text
    
    Returns:
        JSON response indicating success or failure
    """
    try:
        data = request.get_json()
        
        # Get preferences for current user
        preferences = InvestorPreferences.query.filter_by(user_id=current_user.id).first()
        if not preferences:
            preferences = InvestorPreferences(user_id=current_user.id)
        
        # Update preferences with new data
        preferences.industry = data.get('industry', [])
        preferences.stage = data.get('stage', [])
        preferences.location = data.get('location', [])
        preferences.investment_amount = data.get('investment_amount', [])
        preferences.additional_info = data.get('additional_info', '')
        
        # Save to database
        db.session.add(preferences)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully',
            'data': preferences.to_dict()
        })
        
    except Exception as e:
        logger.error(f'Error saving preferences: {str(e)}')
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/preferences', methods=['GET'])
@login_required
def get_preferences():
    """
    Get investor preferences for the current user.
    
    Returns:
        JSON response with user's preferences
    """
    try:
        preferences = InvestorPreferences.query.filter_by(user_id=current_user.id).first()
        if not preferences:
            return jsonify({
                'success': True,
                'data': None
            })
            
        return jsonify({
            'success': True,
            'data': preferences.to_dict()
        })
        
    except Exception as e:
        logger.error(f'Error getting preferences: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/companies', methods=['POST'])
@login_required
def add_company():
    """
    Add a new company and calculate Otani rating.
    
    Expects JSON payload with:
        - company_name: Name of the company
        - industry: Company's industry
        - stage: Company's funding stage
        - location: Company's location
        - your_rating: User's rating (A-D)
        
    Returns:
        JSON response with:
            - success: Boolean indicating success
            - company: Company data including calculated Otani rating
            - error: Error message if failed
    """
    logger.debug('Add company endpoint hit')
    data = request.get_json()
    
    # Get user preferences for Otani rating calculation
    preferences = InvestorPreferences.query.filter_by(user_id=current_user.id).first()
    
    # Calculate Otani rating based on preference matches
    matches = 0
    if preferences:
        if any(ind == data['industry'] for ind in preferences.industry):
            matches += 1
        if any(st == data['stage'] for st in preferences.stage):
            matches += 1
        if any(loc == data['location'] for loc in preferences.location):
            matches += 1
    
    otani_rating = {3: 'A', 2: 'B', 1: 'C', 0: 'D'}[matches]
    
    try:
        # Create and save new company
        company = Company(
            user_id=current_user.id,
            company_name=data['company_name'],
            industry=data['industry'],
            stage=data['stage'],
            location=data['location'],
            your_rating=data.get('your_rating', 'C')
        )
        
        db.session.add(company)
        db.session.commit()
        
        # Prepare response with both ratings
        response_data = company.to_dict()
        response_data['otani_rating'] = otani_rating
        
        logger.debug(f'Company added successfully: {response_data}')
        return jsonify({'success': True, 'company': response_data})
        
    except Exception as e:
        logger.error(f'Error adding company: {str(e)}')
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/companies', methods=['GET'])
@login_required
def get_companies():
    """
    Get all companies for the current user with Otani ratings.
    
    Returns:
        JSON response with:
            - success: Boolean indicating success
            - companies: List of company data including Otani ratings
            - error: Error message if failed
    """
    try:
        # Get user's companies and preferences
        companies = Company.query.filter_by(user_id=current_user.id).all()
        preferences = InvestorPreferences.query.filter_by(user_id=current_user.id).first()
        
        # Prepare response with calculated Otani ratings
        companies_data = []
        for company in companies:
            company_dict = company.to_dict()
            
            # Calculate Otani rating
            matches = 0
            if preferences:
                if any(ind == company.industry for ind in preferences.industry):
                    matches += 1
                if any(st == company.stage for st in preferences.stage):
                    matches += 1
                if any(loc == company.location for loc in preferences.location):
                    matches += 1
            
            company_dict['otani_rating'] = {3: 'A', 2: 'B', 1: 'C', 0: 'D'}[matches]
            companies_data.append(company_dict)
        
        return jsonify({
            'success': True,
            'companies': companies_data
        })
        
    except Exception as e:
        logger.error(f'Error getting companies: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    with app.app_context():
        # Create database tables
        db.create_all()
    app.run(host='0.0.0.0', debug=True)
