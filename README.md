🚀 FinApp — Personal Finance Management System

FinApp is a personal finance web application designed to help users track expenses, manage accounts, set financial goals, and visualize their financial health through charts and analytics.
The application is built with a mobile-first approach and integrates with Firebase for authentication and data storage.

📌 Overview

FinApp enables users to:

Manage income, expenses, and transfer transactions

Track balances across different accounts

Create and monitor financial goals

Visualize financial trends using charts

Use multi-currency with automated exchange rates

Change app theme and language

Recover passwords and update user profile settings

✨ Features
🔹 Accounts

Checking, savings, investment, credit card, and cash accounts

Automatic balance calculation

Transaction linking and audit logs

🔹 Transactions

Full CRUD operations

Income, expense, and transfer types

Recurring transactions

Multi-currency with exchange-rate API

🔹 Financial Goals

Goal creation with target amount

Contributions and progress tracking

Archiving completed goals

🔹 User & Settings

Secure authentication via Firebase

User preferences (theme, currency, language)

Profile management and password recovery

🔹 Interface

Responsive mobile-first design

Jinja2 HTML templates + vanilla JavaScript

Charts for financial analysis

🏗️ Architecture & Tech Stack
Backend

Python

Flask

Firebase Admin SDK

Firestore database

Frontend

HTML

CSS

JavaScript (ES6 modules)

Jinja2 templating engine

External Services

Exchange Rate API for currency updates

Firebase Authentication

Firebase Storage (if used for avatars or uploads)

📂 Project Structure
FinApp/
│
├── app.py                # Main Flask application
├── auth.py               # User authentication routes
├── firebase_service.py   # Firestore + Firebase integration
├── config.py             # App configuration and environment
│
├── templates/            # Jinja2 HTML templates
│   ├── dashboard.html
│   ├── login.html
│   ├── accounts.html
│   ├── goals.html
│   └── ...
│
└── static/               # CSS, JS, images
    ├── css/
    ├── js/
    └── img/

▶️ Getting Started
1. Clone the repository
git clone https://github.com/lopesbrenda/FinApp.git
cd FinApp

2. Create a virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

3. Install dependencies
pip install -r requirements.txt

4. Configure environment variables

Create a .env file:

FIREBASE_CREDENTIALS=your_credentials.json
SECRET_KEY=your_secret_key
EXCHANGE_API_KEY=your_exchange_api_key


Place your Firebase credentials JSON file in the project folder.

5. Run the application
flask run


Open in browser:

http://localhost:5000
