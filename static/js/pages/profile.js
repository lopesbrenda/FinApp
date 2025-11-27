import { auth, db, storage } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { showAlert } from "../utils/alerts.js";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getActivityLogs, groupLogsByDate, getActivityIcon, formatActivityMessage } from "../services/activity-log.js";

// --------------------------------------------------------
// Mini loader
// --------------------------------------------------------
const miniLoader = document.getElementById("mini-loader");

function showLoader(show) {
  if (!miniLoader) return;
  if (show) miniLoader.classList.add("show");
  else miniLoader.classList.remove("show");
}

// --------------------------------------------------------
// Sidebar navigation
// --------------------------------------------------------
document.querySelectorAll(".sidebar-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".sidebar-link")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.target;

    document
      .querySelectorAll(".panel")
      .forEach((p) => p.classList.remove("active"));

    const panel = document.getElementById(target);
    if (panel) panel.classList.add("active");

    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = btn.textContent.trim();
  });
});

// --------------------------------------------------------
// Avatar preview + cropper
// --------------------------------------------------------
const avatarInput = document.getElementById("avatar-input");
const avatarImg = document.getElementById("sidebar-avatar");
const loader = document.getElementById("avatar-loader");

const cropModal = document.getElementById("crop-modal");
const cropImage = document.getElementById("crop-image");
const cropConfirm = document.getElementById("crop-confirm");
const cropCancel = document.getElementById("crop-cancel");

let cropper = null;

// Open input when clicking avatar
if (avatarImg && avatarInput) {
  avatarImg.addEventListener("click", () => avatarInput.click());
}

// When user selects image
if (avatarInput) {
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("Please select an image file.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Image must be smaller than 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      cropImage.src = reader.result;
      cropModal.classList.remove("hidden");

      setTimeout(() => {
        cropper = new Cropper(cropImage, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          background: false,
        });
      }, 50);
    };
    reader.readAsDataURL(file);
  });
}

// Cancel crop
if (cropCancel) {
  cropCancel.addEventListener("click", () => {
    if (cropper) cropper.destroy();
    cropper = null;
    cropModal.classList.add("hidden");
  });
}

// Confirm crop
if (cropConfirm) {
  cropConfirm.addEventListener("click", async () => {
    if (!cropper) return;

    loader.classList.remove("hidden");

    const canvas = cropper.getCroppedCanvas({
      width: 512,
      height: 512,
    });

    canvas.toBlob(
      async (blob) => {
        console.log("📸 Generated avatar BLOB");
        cropModal.classList.add("hidden");
        cropper.destroy();
        cropper = null;

        avatarImg.src = URL.createObjectURL(blob);

        await uploadAvatar(blob);

        loader.classList.add("hidden");
      },
      "image/jpeg",
      0.8
    );
  });
}

async function uploadAvatar(blob) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const fileName = `${user.uid}.jpg`;
    const storageRef = ref(storage, `avatars/${fileName}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    avatarImg.src = downloadURL;
    showAlert("Avatar uploaded!", "success");

    // Save URL to Firestore
    const userRef = doc(db, COLLECTION.USERS, user.uid);
    await updateDoc(userRef, { avatarUrl: downloadURL });

    // Update Firebase Auth profile
    await updateProfile(user, { photoURL: downloadURL });

    return downloadURL;
  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err);
    showAlert("Error uploading avatar.", "error");
  }
}

// --------------------------------------------------------
// Authentication + Firestore real-time sync
// --------------------------------------------------------
let userRef = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }

  const initial = await loadUserProfile(user);

  document.getElementById("profile-name").textContent = initial.name;
  document.getElementById("profile-created").textContent = formatDate(
    initial.createdAt
  );

  document.getElementById("edit-name").value = initial.name;
  document.getElementById("edit-phone").value = initial.phone;
  document.getElementById("edit-email").value = initial.email;

  const expensesAlertCheckbox = document.getElementById("alert-expenses");
  const goalsAlertCheckbox = document.getElementById("alert-goals");
  const currencySelect = document.getElementById("currency-select");

  userRef = doc(db, COLLECTION.USERS, user.uid);

  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const prefs = snap.data().preferences || {};

    expensesAlertCheckbox.checked = !!prefs.alertExpenses;
    goalsAlertCheckbox.checked = !!prefs.alertGoals;
    currencySelect.value = prefs.currency || "EUR";
  }

  // Load profile in real-time
  onSnapshot(userRef, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    if (data.avatarUrl) {
      avatarImg.src = data.avatarUrl;
    }

    document.getElementById("profile-name").textContent =
      data.name || user.displayName || "";
    document.getElementById("profile-created").textContent = formatDate(
      data.createdAt || user.metadata.creationTime
    );

    document.getElementById("edit-name").value = data.name || "";
    document.getElementById("edit-phone").value = data.phone || "";
    document.getElementById("edit-email").value = data.email || "";
  });

  function formatDate(rawDate) {
    if (!rawDate) return "";

    let d;
    if (rawDate.toDate) {
      d = rawDate.toDate();
    } else {
      d = new Date(rawDate);
    }

    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-UK", { month: "short" });
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year} · ${hours}:${minutes}`;
  }
});

// --------------------------------------------------------
// Save Profile (Firestore)
// --------------------------------------------------------
const profileForm = document.getElementById("profile-form");
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userRef) return;

    showLoader(true);

    const payload = {
      name: document.getElementById("edit-name").value,
      phone: document.getElementById("edit-phone").value,
    };

    try {
      await setDoc(userRef, payload, { merge: true });
      
      if (payload.name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: payload.name });
      }
      
      showAlert("Profile updated!", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to update profile.", "error");
    }

    showLoader(false);
  });
}

// --------------------------------------------------------
// Save Settings
// --------------------------------------------------------
const settingsForm = document.getElementById("settings-form");
if (settingsForm) {
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userRef) return;

    showLoader(true);

    const currencyValue = document.getElementById("currency-select").value;
    const languageValue = document.getElementById("language-select").value;
    const alertExpensesValue = document.getElementById("alert-expenses").checked;
    const alertGoalsValue = document.getElementById("alert-goals").checked;

    try {
      await updateDoc(userRef, {
        "preferences.currency": currencyValue,
        "preferences.language": languageValue,
        "preferences.alertExpenses": alertExpensesValue,
        "preferences.alertGoals": alertGoalsValue
      });

      showAlert("Settings saved!", "success");
    } catch (err) {
      console.error("Error saving settings:", err);
      showAlert("Failed to save settings.", "error");
    }

    showLoader(false);
  });
}

// --------------------------------------------------------
// Update Email / Password
// --------------------------------------------------------
const passwordForm = document.getElementById("password-form");
if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newEmail = document.getElementById("edit-email").value;
    const newPassword = document.getElementById("edit-pass").value;

    showLoader(true);

    try {
      if (newEmail) {
        await updateEmail(auth.currentUser, newEmail);
        await updateDoc(userRef, { email: newEmail });
      }

      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }

      showAlert("Credentials updated!", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to update credentials.", "error");
    }

    showLoader(false);
  });
}

// --------------------------------------------------------
// Showing/hiding password
// --------------------------------------------------------
document.querySelectorAll(".toggle-pass").forEach((btn) => {
  const input = document.getElementById(btn.dataset.target);

  btn.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "🙈";
    } else {
      input.type = "password";
      btn.textContent = "🙉";
    }
  });
});

/**
 * Load user profile
 */
async function loadUserProfile(user) {
  const ref = doc(db, COLLECTION.USERS, user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const fallback = {
      name: user.displayName || "",
      email: user.email,
      phone: "",
      createdAt: user.metadata.creationTime,
    };
    await setDoc(ref, fallback);
    console.log("📄 Created fallback profile:", fallback);
    return fallback;
  }
  const data = snap.data();
  console.log("📄 Loaded profile data:", data);
  return {
    name: data.name || user.displayName || "",
    email: data.email || user.email,
    phone: data.phone || "",
    createdAt: data.createdAt || user.metadata.creationTime,
  };
}

// Custom Select: Currency
const box = document.getElementById("currency-select-box");
const trigger = box?.querySelector(".currency-select-trigger");
const options = box?.querySelectorAll(".custom-option");
const selectedText = document.getElementById("currency-selected");
const hiddenInput = document.getElementById("currency-select");

if (trigger) {
  trigger.addEventListener("click", () => {
    box.classList.toggle("open");
  });
}

if (options) {
  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      const value = opt.dataset.value;

      options.forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");

      selectedText.textContent = opt.textContent;
      hiddenInput.value = value;

      box.classList.remove("open");
    });
  });
}

document.addEventListener("click", (e) => {
  if (box && !box.contains(e.target)) {
    box.classList.remove("open");
  }
});

// --------------------------------------------------------
// Activity Log
// --------------------------------------------------------
const activityPeriodFilter = document.getElementById("activity-period-filter");
const activityActionFilter = document.getElementById("activity-action-filter");
const activityEntityFilter = document.getElementById("activity-entity-filter");
const activityList = document.getElementById("activity-list");

let currentUserId = null;

async function loadActivityLogs() {
  if (!currentUserId || !activityList) return;
  
  const filters = {
    period: activityPeriodFilter?.value || '7days',
    actionType: activityActionFilter?.value || 'all',
    entity: activityEntityFilter?.value || 'all'
  };
  
  showLoader(true);
  
  try {
    const logs = await getActivityLogs(currentUserId, filters);
    renderActivityLogs(logs);
  } catch (error) {
    console.error("Error loading activity logs:", error);
    activityList.innerHTML = '<div class="activity-empty">Error loading activity logs.</div>';
  } finally {
    showLoader(false);
  }
}

function renderActivityLogs(logs) {
  if (!activityList) return;
  
  if (!logs || logs.length === 0) {
    activityList.innerHTML = '<div class="activity-empty" data-i18n="activity.empty">No activity found for the selected filters.</div>';
    return;
  }
  
  const grouped = groupLogsByDate(logs);
  const lang = localStorage.getItem('language') || 'en';
  
  const dayLabels = {
    'today': lang === 'pt' ? 'Hoje' : 'Today',
    'yesterday': lang === 'pt' ? 'Ontem' : 'Yesterday'
  };
  
  let html = '';
  
  for (const [dateKey, dayLogs] of Object.entries(grouped)) {
    const displayDate = dayLabels[dateKey] || dateKey;
    
    html += `<div class="activity-day-group">`;
    html += `<div class="activity-day-header">${displayDate}</div>`;
    
    dayLogs.forEach(log => {
      const icon = getActivityIcon(log.action);
      const message = formatActivityMessage(log);
      const timestamp = log.createdAt?.toDate?.() || new Date(log.createdAt);
      const timeStr = timestamp && !isNaN(timestamp) ? timestamp.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      
      html += `
        <div class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div class="activity-message">${message}</div>
            <div class="activity-time">${timeStr}</div>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  activityList.innerHTML = html;
}

if (activityPeriodFilter) {
  activityPeriodFilter.addEventListener("change", loadActivityLogs);
}
if (activityActionFilter) {
  activityActionFilter.addEventListener("change", loadActivityLogs);
}
if (activityEntityFilter) {
  activityEntityFilter.addEventListener("change", loadActivityLogs);
}

document.querySelectorAll(".sidebar-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.target === "activity-panel") {
      loadActivityLogs();
    }
  });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
  }
});
