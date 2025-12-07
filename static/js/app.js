/* ============================================================
   IMPORTS
============================================================ */
import { auth, db } from "./firebase/firebase-config.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";
import { showAlert } from "./utils/alerts.js";
import { logActivity } from "./services/activity-log.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { getUserExpenses } from "./expenses.js";
import { getUserGoals } from "./goals.js";
import { normalizeGoalRecords } from "./utils/goal-normalizer.js";
import { showDailyReminderModal } from "./utils/modal.js";

/* ============================================================
   DAILY REMINDER – NOVAS FUNÇÕES
============================================================ */

// global cache
window.__finappData = { goals: [], expenses: [] };

// detect next 7 days expenses
function computeUpcomingExpenses(allExpenses = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + 7);

  return allExpenses.filter((t) => {
    if (t.type !== "expense") return false;

    const rawDate = t.nextBilling || t.date || t.createdAt;
    if (!rawDate) return false;

    const d =
      rawDate?.toDate && typeof rawDate.toDate === "function"
        ? rawDate.toDate()
        : new Date(rawDate);

    if (isNaN(d.getTime())) return false;

    d.setHours(0, 0, 0, 0);
    return d >= today && d <= limit;
  });
}

// load all goals + expenses (1x only)
export async function loadUserFinancialData(userId) {
  try {
    const [expenses, rawGoals] = await Promise.all([
      getUserExpenses(userId),
      getUserGoals(userId)
    ]);

    const goals = normalizeGoalRecords(rawGoals || []);

    window.__finappData.expenses = expenses || [];
    window.__finappData.goals = goals || [];

    return { expenses, goals };
  } catch (err) {
    console.error("Financial data error:", err);
    return { expenses: [], goals: [] };
  }
}

// initialize reminder safely after login
export async function initDailyReminder(user) {
  if (!user) return;

  const { expenses, goals } = await loadUserFinancialData(user.uid);

  // Keep compatibility for dashboard / analytics
  window.goals = goals;
  window.transactions = expenses;

  const upcomingExpenses = computeUpcomingExpenses(expenses);

  const name =
    window.userProfile?.name ||
    window.userProfile?.displayName ||
    user.displayName ||
    "there";

  showDailyReminderModal({
    goals,
    expenses: upcomingExpenses,
    name,
    currencySymbol: "€"
  });
}

window.loadUserFinancialData = loadUserFinancialData;
window.initDailyReminder = initDailyReminder;

/* ============================================================
   AUTH STATE — SEU BLOCO ORIGINAL (MANTIDO)
============================================================ */

const logoutBtn = document.getElementById("logout-btn");
const userNameEl = document.getElementById("user-name");
const userEmailEl = document.getElementById("user-email");

// LISTENER ORIGINAL (inteiro)
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;

  if (user && user.emailVerified) {
    const userData = doc(db, COLLECTION.USERS, user.uid);

    if (userNameEl) userNameEl.textContent = user.displayName || "User";
    if (userEmailEl) userEmailEl.textContent = user.email;

    // SHOW MENUS LOGADO
    [
      "nav-dashboard",
      "nav-accounts",
      "nav-analytics",
      "nav-recurring",
      "nav-profile",
      "logout-btn"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove("hidden");
        el.style.display = "inline-block";
      }
    });

    // ESCONDER LOGIN & SIGNUP
    ["nav-login", "nav-signup", "nav-home"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    const ctaSection = document.getElementById("cta-section");
    if (ctaSection) ctaSection.style.display = "none";

    const heroWelcome = document.getElementById("hero-welcome");
    if (heroWelcome) {
      const userName = user.displayName || "User";
      heroWelcome.textContent = `Welcome back, ${userName} 💜`;
    }

    // 🌸 INSERIMOS APENAS ISTO:
    initDailyReminder(user);

    if (["/", "/login", "/signup"].includes(path)) {
      setTimeout(() => (window.location.href = "/dashboard"), 300);
    }

  } else {
    // LOGOUT UI HANDLING
    [
      "nav-dashboard",
      "nav-accounts",
      "nav-analytics",
      "nav-recurring",
      "nav-profile",
      "logout-btn"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    ["nav-login", "nav-signup", "nav-home"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove("hidden");
        el.style.display = "inline-block";
      }
    });

    if (
      ["/dashboard", "/profile", "/analytics", "/recurring", "/accounts"].includes(
        path
      )
    ) {
      console.log("🚫 Not logged in — redirecting to login...");
      setTimeout(() => (window.location.href = "/login"), 400);
    }
  }
});

/* ============================================================
   LOGOUT (SEU ORIGINAL)
============================================================ */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await logActivity("logout", "user_db", user.uid, null, {
          email: user.email
        });
      }
      await signOut(auth);
      showAlert("Logged out successfully", "info");
      window.location.href = "/home";
    } catch (err) {
      showAlert("Logout error: " + err.message, "error");
    }
  });
}

/* ============================================================
   FORGOT PASSWORD — ORIGINAL
============================================================ */
const forgotPasswordBtn = document.getElementById("forgot-password-btn");
if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", async () => {
    const emailInput = document.getElementById("login-email");
    const email = emailInput?.value.trim();

    if (!email) {
      showAlert("Please enter your email address first", "error");
      emailInput?.focus();
      return;
    }

    const confirmed = confirm(`Send password reset email to ${email}?`);
    if (!confirmed) return;

    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(
        `Password reset email sent to ${email}. Check your inbox!`,
        "success"
      );
    } catch (err) {
      console.error("Password reset error:", err);
      let msg = "Failed to send reset email: " + err.message;
      if (err.code === "auth/user-not-found")
        msg = "No account found with this email.";
      if (err.code === "auth/invalid-email") msg = "Invalid email address.";
      showAlert(msg, "error");
    }
  });
}

/* ============================================================
   SIGNUP — ORIGINAL
============================================================ */
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("signup-full-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm-password").value;

    if (!fullName || !email || !password || !confirm) {
      showAlert("Please fill all fields", "error");
      return;
    }
    if (password !== confirm) {
      showAlert("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      showAlert("Password must be at least 6 characters", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      const userDocRef = doc(db, COLLECTION.USERS, user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: fullName,
        createdAt: serverTimestamp(),
        preferences: {}
      });

      await sendEmailVerification(user, {
        url: window.location.origin + "/login"
      });

      showAlert(
        "Account created! Please verify your email before login.",
        "success"
      );

      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Signup error:", err);
      showAlert("Signup failed: " + err.message, "error");
    }
  });
}

/* ============================================================
   LOGIN — ORIGINAL
============================================================ */
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        showAlert("Please verify your email before logging in.", "warning");
        return;
      }

      showAlert(`Welcome back, ${user.displayName || "User"}!`, "success");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      let msg = "Login failed: " + err.message;
      if (err.code === "auth/user-not-found")
        msg = "No account found with this email.";
      if (err.code === "auth/wrong-password")
        msg = "Incorrect password.";
      if (err.code === "auth/too-many-requests")
        msg = "Too many failed attempts. Try again later.";
      showAlert(msg, "error");
    }
  });
}

/* ============================================================
   EMAIL VERIFICATION — ORIGINAL
============================================================ */
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode");
const oobCode = urlParams.get("oobCode");

if (mode === "verifyEmail" && oobCode) {
  applyActionCode(auth, oobCode)
    .then(() => {
      showAlert("✅ Email verified successfully!", "success");
      window.location.href = "/login";
    })
    .catch((error) => {
      console.error("Email verification error:", error.message);
      showAlert("❌ Email verification failed: " + error.message, "error");
    });
}

/* ============================================================
   MOBILE NAV
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("mobile-nav-toggle");
  const navLinks = document.getElementById("mobile-nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }
});

/* ============================================================
   THEME SWITCHER — ORIGINAL
============================================================ */
const themeToggle = document.getElementById("theme-toggle");
const themeSystemBtn = document.getElementById("theme-system");
const themeLightBtn = document.getElementById("theme-light");
const themeDarkBtn = document.getElementById("theme-dark");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  document.dispatchEvent(
    new CustomEvent("themeChanged", { detail: { theme } })
  );
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme-preference") || "system";
  if (savedTheme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    applyTheme(prefersDark ? "dark" : "light");
  } else {
    applyTheme(savedTheme);
  }
}

function setTheme(theme) {
  localStorage.setItem("theme-preference", theme);
  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    applyTheme(prefersDark ? "dark" : "light");
  } else {
    applyTheme(theme);
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light" : "dark");
  });
}

if (themeSystemBtn) themeSystemBtn.addEventListener("click", () => setTheme("system"));
if (themeLightBtn) themeLightBtn.addEventListener("click", () => setTheme("light"));
if (themeDarkBtn) themeDarkBtn.addEventListener("click", () => setTheme("dark"));

loadTheme();
