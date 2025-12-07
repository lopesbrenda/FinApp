## 🌐 Languages
[🇺🇸 English](./README.md) | [🇧🇷 Português (BR)](./README.pt-BR.md)

---

# FinApp
*Personal Finance Manager with Firebase Realtime Sync*

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)

## 🏗️ Project Architecture

### Overview
FinApp is a complete financial application built with **Flask (Python backend)** + **Firebase (realtime database)** + **Modular JavaScript (SPA-like frontend)**.

**Tech Stack**:
Backend: Flask + Firebase Admin SDK
Frontend: Vanilla JS (modular) + CSS modules + i18n + Design Tokens
Database: Firestore (NoSQL realtime)
Auth: Firebase Authentication

text

### Directory Structure
FinApp/     
├── app.py # Main Flask app + routes    
├── config.py # Firebase/Flask config   
├── auth.py # Backend auth logic    
├── firebase_service.py # Firebase Admin SDK client     
├── templates/ # HTML templates (9 pages)   
│ ├── index.html, login.html, dashboard.html...     
├── static/     
│ ├── style/ # Modular CSS (7 files)    
│ │ ├── main.css, components.css, profile.css...    
│ └── js/   
│ ├── app.js # Core app initialization  
│ ├── i18n.js # Internationalization (28k+ lines!)  
│ ├── design-tokens.json # Design tokens    
│ ├── firebase/ # Firebase SDK (4 files)    
│ ├── pages/ # Page logic (6 files ~130k lines)     
│ │ ├── dashboard.js, analytics.js (38k+), profile.js...    
│ ├── services/ # Business services (5 files)   
│ │ ├── accounts-service.js (18k+), currency-service.js...  
│ └── utils/ # Cross-cutting utils (8 files)    
│ ├── modal.js (31k+), projections.js...    


### Data Flow
User visits /login → Flask renders login.html

JS (auth.js) → Firebase Auth → successful login

Redirects to /dashboard → renders dashboard.html

dashboard.js → loads services → Firestore queries → populates UI

Interactions → utils + services → Firestore mutations (realtime)

i18n.js handles multilingual 

theme.js + design-tokens.json apply dynamic styles



## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js (optional, for dev tools)
- Firebase project with Firestore + Auth enabled

### Installation
Clone repository    
git clone https://github.com/lopesbrenda/FinApp.git     
cd FinApp

Install Python dependencies     
pip install -r requirements.txt

Setup Firebase (see config instructions below)      
cp serviceAccount.json.example serviceAccount.json      

Run development server      
python app.py


**Visit**: `http://localhost:5000`

## 🔧 Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database**
4. Download **Service Account JSON** → rename to `serviceAccount.json`
5. Update `config.py` with your project details

## 📱 Features

- ✅ Multi-currency support
- ✅ Recurring transactions
- ✅ Financial goals with progress tracking
- ✅ Real-time analytics & projections
- ✅ Multi-language (i18n ready)
- ✅ Responsive design (mobile-first)
- ✅ Firebase realtime sync

## 🛠️ Development

Run with auto-reload        
python app.py       

Lint & format       
pip install black flake8        
black .     
flake8 .        


## 📄 License
MIT License - see [LICENSE](LICENSE) for details.