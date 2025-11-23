// @@ static/js/auth.js

import { auth, db } from "./firebase-config.js";
import { showAlert } from "./utils/alerts.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Toggle password visibility
document.querySelectorAll(".eye-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "👁️" : "🙈";
  });
});


// Toggle show/hide password
document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "👁️" : "🙈";
  });
});

// Login
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
/*
      if (!user.emailVerified) {
        alert("Please verify your email before continuing.");
        return;
      }
*/
      window.location.href = "/dashboard";
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}
