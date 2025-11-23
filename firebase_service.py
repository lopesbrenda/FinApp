import firebase_admin
from firebase_admin import credentials, firestore, auth
import json
import os

cred_path = os.getenv("FIREBASE_CERT")

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()
