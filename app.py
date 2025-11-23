# @@ app.py

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
    return render_template('home.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/settings')
def settings():
    return render_template('profile.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')


# ==================== API ROUTES ====================
# These routes serve Firebase configuration securely to frontend

@app.route('/firebase-config.js')
def firebase_config():
    js_code = f"export const firebaseConfig = {json.dumps(Config.FIREBASE_FRONTEND, indent=2)};"
    return app.response_class(js_code, mimetype='application/javascript')

@app.route('/collections.js')
def collections():
    js_code = f"export const COLLECTIONS = {json.dumps(Config.FIREBASE_COLLECTIONS, indent=2)};"
    return app.response_class(js_code, mimetype='application/javascript')


# ==================== RUN THE APP ====================
if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
    app.run(debug=(Config.FLASK_ENV == "development"))
