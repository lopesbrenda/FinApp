"""
Authentication blueprint - handles login/logout with Firebase Auth.
Validates JWT tokens from frontend and creates Flask sessions.
"""

from flask import Blueprint, request, jsonify, session, redirect, url_for, flash
from firebase_service import verify_firebase_token, get_user_data, db

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
    # Check if user is authenticated
    if 'uid' not in session or session['uid'] != uid:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_data = get_user_data(uid)
    
    if user_data:
        return jsonify(user_data), 200
    else:
        return jsonify({"error": "User not found"}), 404
