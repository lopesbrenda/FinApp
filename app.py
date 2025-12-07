# @@ app.py


from email_service import EmailService
from flask import Flask, render_template
from config import Config
from auth import auth_bp
import json

app = Flask(__name__)
app.config.from_object(Config)

# Register authentication blueprint
app.register_blueprint(auth_bp)

from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)

from auth import (
    create_access_token, 
    create_refresh_token, 
    verify_token, 
    refresh_token_endpoint,
    require_auth
)

# ==================== HTML ROUTES ====================
# These routes render templates for the user interface

@app.route("/api/auth/refresh", methods=["POST"])
def api_refresh_token():
    """API endpoint for token refresh"""
    return refresh_token_endpoint()

@app.route("/api/auth/verify", methods=["POST"])
def api_verify_token():
    """Verify token validity"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = verify_token(token)
    if user_id:
        return jsonify({"valid": True, "user_id": user_id}), 200
    return jsonify({"valid": False}), 401

@app.route('/')
@app.route('/home')
def home():
    """Home page"""
    return render_template('home.html')

@app.route('/profile')
def profile():
    """User profile page"""
    return render_template('profile.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard with income/expense tracking"""
    return render_template('dashboard.html')

@app.route('/analytics')
def analytics():
    """Analytics page with charts and visualizations"""
    return render_template('analytics.html')

@app.route('/recurring')
def recurring():
    """Recurring transactions management page"""
    return render_template('recurring.html')

@app.route('/accounts')
def accounts():
    """Bank accounts and cards management page"""
    return render_template('accounts.html')

@app.route('/login')
def login():
    """Login page"""
    return render_template('login.html')

@app.route('/signup')
def signup():
    """Sign up page"""
    return render_template('signup.html')


@app.route("/api/transactions/<transaction_id>/soft-delete", methods=["PATCH"])
@require_auth
def soft_delete_transaction(transaction_id):
    """Soft delete transaction with 24h recovery"""
    data = request.get_json()
    deleted_at = data.get("deletedAt")
    
    # Update Firestore with soft delete
    doc_ref = db.collection("users").document(g.current_user_id).collection("transactions").document(transaction_id)
    doc_ref.update({
        "deletedAt": deleted_at,
        "permanentlyDeleted": False
    })
    
    return jsonify({"success": True, "message": "Transaction soft deleted (24h recovery)"}), 200


@app.route("/api/llection>/<doc_id>/soft-delete", methods=["PATCH"])
@require_auth
def generic_soft_delete(collection, doc_id):
    """Generic soft delete for any user collection"""
    data = request.get_json()
    deleted_at = data.get("deletedAt")
    
    # Validate collection (security)
    allowed_collections = ["transactions", "goals", "accounts"]
    if collection not in allowed_collections:
        return jsonify({"error": "Invalid collection"}), 403
    
    doc_ref = db.collection("users").document(g.current_user_id)\
                .collection(collection).document(doc_id)
    
    doc_ref.update({
        "deletedAt": deleted_at,
        "permanentlyDeleted": False
    })
    
    return jsonify({
        "success": True, 
        "message": f"{collection} soft deleted (24h recovery)"
    }), 200


# ==================== API ROUTES ====================
# These routes serve Firebase configuration securely to frontend

@app.route('/firebase-config.js')
def firebase_config():
    """
    Serve Firebase client config as JavaScript module.
    Config comes from environment variables via Config class.
    """
    js_code = f"export const firebaseConfig = {json.dumps(Config.FIREBASE_FRONTEND, indent=2)};"
    return app.response_class(js_code, mimetype='application/javascript')

@app.route('/collections.js')
def collections():
    """
    Serve Firestore collection names as JavaScript module.
    Collection names come from environment variables via Config class.
    """
    js_code = f"export const COLLECTIONS = {json.dumps(Config.FIREBASE_COLLECTIONS, indent=2)};"
    return app.response_class(js_code, mimetype='application/javascript')


# NEW: Security Headers Middleware (add before if __name__ == '__main__':)
@app.after_request
def security_headers(response):
    """Security headers (request-agnostic version)"""
    # Basic security headers (sempre funcionam)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

@app.before_request
def force_https():
    """Force HTTPS in production"""
    if not app.debug and not request.is_secure:
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)


@app.route("/api/notifications/send-goal-alert", methods=["POST"])
@require_auth
def send_goal_alert():
    """Send goal completion alert"""
    data = request.get_json()
    user_email = data.get("email")
    goal_name = data.get("goalName")
    progress = data.get("progress")
    
    EmailService.goal_completion_alert(user_email, goal_name, progress)
    return jsonify({"success": True}), 200

@app.route("/api/notifications/send-expense-alert", methods=["POST"])
@require_auth
def send_expense_alert():
    """Send expense limit alert"""  
    data = request.get_json()
    user_email = data.get("email")
    category = data.get("category")
    spent = data.get("spent")
    limit = data.get("limit")
    
    EmailService.expense_limit_alert(user_email, category, spent, limit)
    return jsonify({"success": True}), 200


# ==================== RUN THE APP ====================
if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
    app.run(debug=(Config.FLASK_ENV == "development"))
