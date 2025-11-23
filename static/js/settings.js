import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const form = document.getElementById("settings-form");
const alertExpenses = document.getElementById("alert-expenses");
const alertGoals = document.getElementById("alert-goals");
const darkMode = document.getElementById("dark-mode");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "/login";

  const userRef = doc(db, "user_db", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const prefs = snap.data().preferences || {};
    alertExpenses.checked = !!prefs.alertExpenses;
    alertGoals.checked = !!prefs.alertGoals;
    darkMode.checked = !!prefs.darkMode;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await setDoc(userRef, {
      preferences: {
        alertExpenses: alertExpenses.checked,
        alertGoals: alertGoals.checked,
        darkMode: darkMode.checked,
      }
    }, { merge: true });

    alert("Preferências salvas!");
    if (darkMode.checked) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  });
});
