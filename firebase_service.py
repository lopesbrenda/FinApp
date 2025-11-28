# @@ firebase_service.py
"""
Firebase Admin SDK service for backend operations.
Handles server-side Firebase operations (Firestore, Storage, Auth validation).
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth as admin_auth
import base64
import json
from config import Config

# Initialize Firebase Admin SDK (only once)
if not firebase_admin._apps:
    try:
        if Config.FIREBASE_CERT_BASE64:
            # Decode base64 service account key
            cert_dict = json.loads(base64.b64decode(Config.FIREBASE_CERT_BASE64))
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized successfully")
        else:
            print("⚠️ FIREBASE_CERT_BASE64 not found - Admin SDK not initialized")
    except Exception as e:
        print(f"❌ Error initializing Firebase Admin SDK: {e}")

# Expose Firestore client for backend operations
try:
    db = firestore.client()
except Exception as e:
    print(f"⚠️ Firestore client not available: {e}")
    db = None


def verify_firebase_token(id_token):
    """
    Verify Firebase ID token from frontend.
    Returns decoded token if valid, None otherwise.
    """
    try:
        decoded_token = admin_auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        return None


def get_user_data(uid):
    """Get user data from Firestore by UID"""
    if not db:
        return None
    try:
        user_doc = db.collection('users').document(uid).get()
        if user_doc.exists:
            return user_doc.to_dict()
        return None
    except Exception as e:
        print(f"❌ Error fetching user data: {e}")
        return None


def update_user_data(uid, data):
    """Update user data in Firestore"""
    if not db:
        return False
    try:
        db.collection('users').document(uid).set(data, merge=True)
        return True
    except Exception as e:
        print(f"❌ Error updating user data: {e}")
        return False
