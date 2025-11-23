import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    FLASK_ENV = os.getenv("FLASK_ENV")
    FIREBASE_CERT = os.getenv("FIREBASE_CERT")
    #FIREBASE_DB_URL = os.getenv("FIREBASE_DB_URL")
    #FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")