# auth.py
import firebase_admin
from firebase_admin import credentials, auth, firestore
from flask import Blueprint, render_template, request, redirect, url_for, flash, session

auth_bp = Blueprint('auth_bp', __name__)

# Inicializa Firebase se ainda não estiver inicializado
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_service_account.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Rota de registro
@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']

        try:
            user = auth.create_user(email=email, password=password, display_name=name)
            db.collection('users').document(user.uid).set({
                'name': name,
                'email': email
            })
            flash('✅ Account created successfully! You can now log in.', 'success')
            return redirect(url_for('auth_bp.login'))
        except Exception as e:
            flash(f'⚠️ Error: {str(e)}', 'danger')

    return render_template('signup.html')

# Rota de login
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        try:
            # Firebase Admin não valida senhas diretamente
            # Então usamos o client SDK (em app.js) e enviamos o token
            flash('Login attempted (handled via frontend JS Firebase).', 'info')
        except Exception as e:
            flash(f'⚠️ Error: {str(e)}', 'danger')

    return render_template('login.html')

# Logout
@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth_bp.login'))
