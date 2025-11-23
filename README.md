# 📘 FinApp — Personal Finance Tracker    
FinApp is a modular web application built with Flask and Firebase, designed to help users manage expenses, set savings goals, and track financial progress in real time.

# 🧱 Project Structure    
finapp/ 
│   
├── app.py                  # Main Flask app, registers routes and blueprints   
├── config.py               # Centralized environment config (backend + frontend)   
├── firebase_service.py     # Initializes Firebase Admin SDK and exposes Firestore  
├── auth.py                 # Authentication blueprint (signup, login, logout)  
│   
├── templates/              # HTML templates rendered by Flask  
│   ├── base/               # Shared layout and components  
│   ├── signup.html     
│   ├── login.html  
│   ├── dashboard.html  
│   └── firebase-config.js  # JS template exposing Firebase config to frontend  
│   
├── static/     
│   ├── css/     
│   ├── js/     
│   │   ├── firebase-config.js   # Firebase Client SDK initialization   
│   │   ├── firebase-dbs.js      # Collection names + generic Firestore helpers     
│   │   ├── dashboard.js         # Dashboard logic and rendering    
│   │   ├── expenses.js          # Expense/income logic     
│   │   ├── goals.js             # Savings goal logic   
│   │   ├── settings.js          # User preferences     
│   │   ├── chat.js              # Chat message handling    
│   │   ├── utils/               # Alerts, animations, helpers  
│   └── favicon/    
│   
├── .env                    # Environment variables (not committed)     
└── requirements.txt        # Python dependencies   



# ⚙️ Technologies Used
- Flask — lightweight backend framework
- Firebase Admin SDK — server-side user and Firestore management
- Firebase Client SDK — frontend authentication and Firestore access
- Firestore — NoSQL database for user data
- Chart.js — data visualization
- Jinja2 — templating engine for dynamic HTML/JS
- dotenv — environment variable management

# 🔐 Environment Setup
Create a .env file with the following keys:
SECRET_KEY=your_flask_secret
FLASK_ENV=development

## Firebase Admin SDK (base64-encoded service account JSON)
FIREBASE_CERT_BASE64=...        

## Firebase Client SDK (frontend)
FIREBASE_API_KEY=...        
FIREBASE_AUTH_DOMAIN=...        
FIREBASE_PROJECT_ID=...     
FIREBASE_STORAGE_BUCKET=...     
FIREBASE_MESSAGING_SENDER_ID=...        
FIREBASE_APP_ID=...     


# 🚀 Running the App
### Install dependencies
pip install -r requirements.txt

### Run Flask app
python app.py

Access the app at http://localhost:5000


# 🧠 Core Modules 
| Module | Purpose |     
| ------------- | ------------- |
| `auth.py` | Signup, login, logout routes |  
| `firebase_service.py` | Initializes Firebase Admin SDK |  
| `firebase-dbs.js` | Collection names + Firestore helpers |  
| `goals.js` | Add/update user savings goals |     
| `expenses.js` | Add/delete income and expenses |  
| `settings.js` | Manage user preferences (alerts, theme) |  
| `chat.js` | Store and retrieve user messages |  
| `dashboard.js` | Render financial data and charts
 |     



## 🧩 Extending the App
- Add subcollections for transactions, notifications, or logs
- Integrate email verification and password reset
- Add budget categories and currency conversion
- Create admin dashboard for analytics

## 📦 Deployment Notes
- Use environment variables for production secrets
- Serve firebase-config.js via Flask to avoid exposing .env
- Protect routes with session or token validation
