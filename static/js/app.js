// @@ static/js/app.js

import { auth, db } from "./firebase-config.js";
import { showAlert } from "./utils/alerts.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile, 
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


/* Toggle password visibility helper */
function setupToggle(idToggle, idInput) {
  const btn = document.getElementById(idToggle);
  const input = document.getElementById(idInput);
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "🙈";
    } else {
      input.type = "password";
      btn.textContent = "👁️";
    }
  });
}

// initialize toggles (login and signup)
setupToggle("toggle-login-password", "login-password");
setupToggle("toggle-signup-password", "signup-password");
setupToggle("toggle-signup-confirm", "signup-confirm-password");

/*
  Auth state listener
  - Redirect rules:
  - if user is logged in and on /login or /signup or / => go to /dashboard
  - if user is NOT logged in and tries to access protected routes (/dashboard, /home) => go to /login
*/

const logoutBtn = document.getElementById("logout-btn");
const userNameEl = document.getElementById("user-name");
const userEmailEl = document.getElementById("user-email");


// Listen for auth changes
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;

  if (user && user.emailVerified) {
    // Display user info
    if (userNameEl) userNameEl.textContent = user.displayName || "User";
    if (userEmailEl) userEmailEl.textContent = user.email;

    // Show protected links
    ["nav-dashboard", "nav-profile", "nav-settings", "logout-btn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "inline-block";
    });
    ["nav-login", "nav-signup"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    // ✅ Only redirect if we are on login/signup/home — and wait for auth to settle
    if (["/", "/login", "/signup"].includes(path)) {
      console.log("✅ Auth confirmed, redirecting to dashboard...");
      setTimeout(() => (window.location.href = "/dashboard"), 300);
    }
  } else {
    // Hide protected links
    ["nav-dashboard", "nav-profile", "nav-settings", "logout-btn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    ["nav-login", "nav-signup"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "inline-block";
    });

    // ❗ Add small delay before redirect to avoid conflict during state change
    if (["/dashboard", "/profile", "/settings"].includes(path)) {
      console.log("🚫 Not logged in — redirecting to login...");
      setTimeout(() => (window.location.href = "/login"), 400);
    }
  }
});


/* LOGOUT handler */
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        showAlert("Logged out successfully", "info");
        window.location.href = "/home";
      })
      .catch((err) => showAlert("Logout error: " + err.message));
  });
}


/* SIGNUP handler */
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("signup-full-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm-password").value;

    // --- Client-side validation ---
    if (!fullName || !email || !password || !confirm) {
      showAlert("Please fill all fields", "error");
      return;
    }
    if (password !== confirm) {
      showAlert("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      showAlert("Password must be at least 6 characters (Firebase requirement)", "error");
      return;
    }

    try {
      // --- Create user in Firebase Auth ---
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- Update Auth profile with displayName ---
      await updateProfile(user, { displayName: fullName });

      // --- Save Firestore profile (make sure path is correct) ---
      const userDocRef = doc(db, "user_db", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: fullName,
        createdAt: serverTimestamp(),
        preferences: {},
      });

      // --- Send verification email ---
      await sendEmailVerification(user, {
        url: window.location.origin + "/login",
        handleCodeInApp: true,
      });

      showAlert("Account created! Please verify your email before login.", "success");

      // --- Logout and redirect ---
      await signOut(auth);
      window.location.href = "/login";

    } catch (err) {
      console.error("Signup error:", err);
      showAlert("Signup failed: " + err.message, "error");
    }
  });
}

// Handle dark mode toggle in navbar
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "🌙";
  }

  themeToggle.addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    themeToggle.textContent = dark ? "🌙" : "🌞";
    showAlert(dark ? "Dark mode enabled" : "Light mode enabled", "info");
  });
}

/* LOGIN handler */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showAlert("Please enter both email and password", "error");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        showAlert("Please verify your email before logging in.", "warning");
        return;
      }

      showAlert(`Welcome back, ${user.displayName || "User"}!`, "success");
      
      // small delay to ensure auth state propagates
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      console.error("Login error:", err);
      let msg = "Login failed: " + err.message;
      if (err.code === "auth/user-not-found") msg = "No account found with this email.";
      if (err.code === "auth/wrong-password") msg = "Incorrect password.";
      if (err.code === "auth/too-many-requests") msg = "Too many failed attempts. Try again later.";
      showAlert(msg, "error");
    }
  });
}
