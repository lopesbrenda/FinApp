from flask import Flask, render_template, jsonify
from auth import auth_bp
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = "supersecretkey"
app.register_blueprint(auth_bp)

# 🔹 Firebase config route — safely exposes to frontend
@app.route("/firebase-config.js")
def firebase_config():
    config = {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"),
    }

    js = "export const firebaseConfig = " + str(config).replace("'", '"') + ";"
    return app.response_class(js, mimetype="application/javascript")


# 🔹 Routes
@app.route("/")
def index():
    return render_template("home.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/signup")
def signup():
    return render_template("signup.html")

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/profile")
def profile():  
    return render_template("profile.html")

@app.route("/settings")
def settings():  
    return render_template("settings.html")

if __name__ == "__main__":
    app.run(debug=True)
