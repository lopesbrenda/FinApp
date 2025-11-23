# @@ config.py

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret")
    FLASK_ENV = os.getenv("FLASK_ENV")
    FIREBASE_CERT_BASE64 = os.getenv("FIREBASE_CERT_BASE64")

    # 🔥 Firebase frontend configuration
    FIREBASE_FRONTEND = {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID")
    }

    # 🗂️ Firestore collections
    FIREBASE_COLLECTIONS = {
        "USER_COLLECTION": os.getenv("FIREBASE_DB_USER", "user_db"),
        "TRANSACTION_COLLECTION": os.getenv("FIREBASE_DB_TRANSACTION", "transactions"),
        "BUDGET_COLLECTION": os.getenv("FIREBASE_DB_BUDGET", "budgets"),
        "CATEGORY_COLLECTION": os.getenv("FIREBASE_DB_CATEGORY", "categories"),
        "CURRENCY_COLLECTION": os.getenv("FIREBASE_DB_CURRENCY", "currencies"),
        "SETTINGS_COLLECTION": os.getenv("FIREBASE_DB_SETTINGS", "settings"),
    }

        # Firestore collection names
    FIREBASE_COLLECTIONS = {
        "userCollection": os.getenv("FIREBASE_DB_USER", "users"),
        "transactionCollection": os.getenv("FIREBASE_DB_TRANSACTION", "transactions"),
        "budgetCollection": os.getenv("FIREBASE_DB_BUDGET", "budgets"),

        "categoryCollection": os.getenv("FIREBASE_DB_CATEGORY", "categories"),
        "currencyCollection": os.getenv("FIREBASE_DB_CURRENCY", "currencies"),
        "settingsCollection": os.getenv("FIREBASE_DB_SETTINGS", "settings"),
        
        "goalsCollection": os.getenv("FIREBASE_DB_GOALS", "goals"),
        "activityLogsCollection": os.getenv("FIREBASE_DB_ACTIVITY_LOGS", "activityLogs")
    }