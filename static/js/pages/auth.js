// static/js/pages/auth.js
// Login and Signup functionality

import { auth, db } from "../firebase/firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { showAlert } from "../utils/alerts.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";

// ========================================
// LOGIN
// ========================================
const loginForm = document.getElementById("login-form");
const forgotPasswordBtn = document.getElementById("forgot-password-btn");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showAlert("Please fill in all fields.", "error");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAlert("Login successful!", "success");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      let message = "Login failed. Please check your credentials.";
      
      if (error.code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later.";
      }
      
      showAlert(message, "error");
    }
  });
}

if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", () => {
    showForgotPasswordModal();
  });
}

function showForgotPasswordModal() {
  const existingModal = document.getElementById("custom-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "custom-modal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal-content">
      <h2 data-i18n="forgot.title">Reset Password</h2>
      <p data-i18n="forgot.description" style="color: #666; margin-bottom: 20px;">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <div class="form-group">
        <label for="reset-email" data-i18n="forgot.email.label">Email Address</label>
        <input type="email" id="reset-email" placeholder="your@email.com" required />
      </div>
      <div class="modal-actions">
        <button id="modal-cancel" class="btn btn-secondary" data-i18n="forgot.cancel">Cancel</button>
        <button id="modal-confirm" class="btn" data-i18n="forgot.send">Send Reset Link</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add("show"), 10);

  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  };

  document.getElementById("modal-cancel").addEventListener("click", closeModal);

  document.getElementById("modal-confirm").addEventListener("click", async () => {
    const emailInput = document.getElementById("reset-email");
    const email = emailInput.value.trim();

    if (!email) {
      showAlert("Please enter your email address.", "error");
      return;
    }

    if (!email.includes("@")) {
      showAlert("Please enter a valid email address.", "error");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showAlert("Password reset email sent! Check your inbox.", "success");
      closeModal();
    } catch (error) {
      console.error("Password reset error:", error);
      let message = "Failed to send reset email. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        message = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many requests. Please try again later.";
      }
      
      showAlert(message, "error");
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

// ========================================
// SIGNUP
// ========================================
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = signupForm.querySelector('input[type="text"]');
    const emailInput = signupForm.querySelector('input[type="email"]');
    const passwordInputs = signupForm.querySelectorAll('input[type="password"]');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInputs[0].value;
    const confirmPassword = passwordInputs[1].value;

    if (!name || !email || !password || !confirmPassword) {
      showAlert("Please fill in all fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords do not match.", "error");
      return;
    }

    if (password.length < 6) {
      showAlert("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name
      });

      await setDoc(doc(db, COLLECTION.USERS, user.uid), {
        name: name,
        email: email,
        createdAt: serverTimestamp(),
        preferences: {
          currency: "EUR",
          language: "en",
          alertExpenses: false,
          alertGoals: false,
          customCategories: [],
          paymentMethods: ["Credit Card", "Debit Card", "Cash"]
        }
      });

      showAlert("Account created successfully!", "success");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Signup error:", error);
      let message = "Signup failed. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Use at least 6 characters.";
      }
      
      showAlert(message, "error");
    }
  });
}
