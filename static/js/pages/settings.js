// @@ static/js/pages/settings.js
// Controls settings panel inside profile page.
// Comments in en-UK.

import { auth, db } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { showAlert } from "../utils/alerts.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


const form = document.getElementById("settings-form");

const expensesAlertCheckbox = document.getElementById("alert-expenses");
const goalsAlertCheckbox = document.getElementById("alert-goals");
const currencySelect = document.getElementById("currency-select");


// --------------------------------------------------------
// Tiny loader shared with profile (if exists)
// --------------------------------------------------------
const miniLoader = document.getElementById("mini-loader");

function showLoader(show) {
  if (!miniLoader) return;
  if (show) miniLoader.classList.add("show");
  else miniLoader.classList.remove("show");
}


// --------------------------------------------------------
// Load user settings
// --------------------------------------------------------
let userRef = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }

  userRef = doc(db, COLLECTION.USERS, user.uid);

  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const prefs = snap.data().preferences || {};

    expensesAlertCheckbox.checked = !!prefs.alertExpenses;
    goalsAlertCheckbox.checked = !!prefs.alertGoals;
    currencySelect.value = prefs.currency || "EUR";
  }
});


// --------------------------------------------------------
// Save settings
// --------------------------------------------------------
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!userRef) return;

    showLoader(true);

    const prefs = {
      alertExpenses: expensesAlertCheckbox.checked,
      alertGoals: goalsAlertCheckbox.checked,
      currency: currencySelect.value,
    };

    try {
      await setDoc(userRef, { preferences: prefs }, { merge: true });

      // Notify other scripts
      window.dispatchEvent(
        new CustomEvent("preferencesUpdated", { detail: prefs })
      );

      showAlert("Preferences updated!", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to save preferences.", "danger");
    }

    showLoader(false);
  });
}
