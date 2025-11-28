# @@ app.py

"""
FinLife - Personal Finance Management Application
Main Flask application file.

This is the heart of the Flask app:
- Creates Flask app instance
- Loads configuration from config.py
- Registers blueprints (auth, etc.)
- Defines HTML routes
- Defines API routes for Firebase config
- Starts the server
"""

from flask import Flask, render_template
from config import Config
from auth import auth_bp
import json

app = Flask(__name__)
app.config.from_object(Config)

# Register authentication blueprint
app.register_blueprint(auth_bp)

# ==================== HTML ROUTES ====================
# These routes render templates for the user interface

@app.route('/')
@app.route('/home')
def home():
    """Home page"""
    return render_template('home.html')

@app.route('/profile')
def profile():
    """User profile page"""
    return render_template('profile.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard with income/expense tracking"""
    return render_template('dashboard.html')

@app.route('/analytics')
def analytics():
    """Analytics page with charts and visualizations"""
    return render_template('analytics.html')

@app.route('/recurring')
def recurring():
    """Recurring transactions management page"""
    return render_template('recurring.html')

@app.route('/accounts')
def accounts():
    """Bank accounts and cards management page"""
    return render_template('accounts.html')

@app.route('/login')
def login():
    """Login page"""
    return render_template('login.html')

@app.route('/signup')
def signup():
    """Sign up page"""
    return render_template('signup.html')


# ==================== API ROUTES ====================
# These routes serve Firebase configuration securely to frontend

@app.route('/firebase-config.js')
def firebase_config():
    """
    Serve Firebase client config as JavaScript module.
    Config comes from environment variables via Config class.
    """
    js_code = f"export const firebaseConfig = {json.dumps(Config.FIREBASE_FRONTEND, indent=2)};"
    return app.response_class(js_code, mimetype='application/javascript')

@app.route('/collections.js')
def collections():
    """
    Serve Firestore collection names as JavaScript module.
    Collection names come from environment variables via Config class.
    """
    js_code = f"export const COLLECTIONS = {json.dumps(Config.FIREBASE_COLLECTIONS, indent=2)};"
    return app.response_class(js_code, mimetype='application/javascript')


# ==================== RUN THE APP ====================
if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
    app.run(debug=(Config.FLASK_ENV == "development"))
