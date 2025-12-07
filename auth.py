import jwt
import time
from datetime import timedelta, datetime
from functools import wraps
from dotenv import load_dotenv
import os

from flask import Blueprint, request, jsonify, session, redirect, url_for, flash
from firebase_service import verify_firebase_token, get_user_data, db

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-fallback-never-use-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/verify', methods=['POST'])
def verify_token():
    """
    Verify Firebase ID token from frontend.
    Creates Flask session if valid.
    """
    data = request.get_json()
    id_token = data.get('idToken')
    
    if not id_token:
        return jsonify({"error": "No token provided"}), 400
    
    # Verify token using Firebase Admin SDK
    decoded_token = verify_firebase_token(id_token)
    
    if decoded_token:
        # Token is valid - create Flask session
        session['uid'] = decoded_token['uid']
        session['email'] = decoded_token.get('email')
        
        return jsonify({
            "success": True,
            "uid": decoded_token['uid'],
            "email": decoded_token.get('email')
        }), 200
    else:
        return jsonify({"error": "Invalid token"}), 401


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """Clear Flask session (logout)"""
    session.clear()
    return jsonify({"success": True}), 200


@auth_bp.route('/api/auth/session', methods=['GET'])
def check_session():
    """Check if user has active Flask session"""
    if 'uid' in session:
        return jsonify({
            "authenticated": True,
            "uid": session['uid'],
            "email": session.get('email')
        }), 200
    else:
        return jsonify({"authenticated": False}), 200


@auth_bp.route('/api/user/<uid>', methods=['GET'])
def get_user(uid):
    """Get user data from Firestore (backend)"""
    if 'uid' not in session or session['uid'] != uid:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_data = get_user_data(uid)
    
    if user_data:
        return jsonify(user_data), 200
    else:
        return jsonify({"error": "User not found"}), 404


def create_access_token(user_id):
    """Generate short-lived access token"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id):
    """Generate long-lived refresh token"""
    payload = {
        "user_id": user_id,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        g.current_user_id = user_id
        return f(*args, **kwargs)
    return decorated_function

def refresh_token_endpoint():
    """Refresh access token endpoint - IMPORTAR NO app.py"""
    data = request.get_json()
    refresh_token = data.get("refresh_token")
    
    if not refresh_token:
        return jsonify({"error": "Refresh token required"}), 400
    
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid refresh token"}), 401
        
        user_id = payload["user_id"]
        return jsonify({
            "access_token": create_access_token(user_id),
            "refresh_token": create_refresh_token(user_id)
        })
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401