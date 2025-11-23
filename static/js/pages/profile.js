// @@ static/js/pages/profile.js

import { auth, db } from "../firebase/firebase-config.js";
import { COLLECTION, spbs } from "../firebase/firebase-dbs.js";
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
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // update page title
    const titleEl = document.getElementById("profile-title");
    if (titleEl) titleEl.textContent = btn.textContent.trim();
  });
});

// --------------------------------------------------------
// Avatar preview (local preview only)
// --------------------------------------------------------
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

// abrir input ao clicar no avatar
if (avatarImg && avatarInput) {
  avatarImg.addEventListener("click", () => avatarInput.click());
}

// quando usuário escolhe a imagem
if (avatarInput) {
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

// cancelar crop
if (cropCancel) {
  cropCancel.addEventListener("click", () => {
    if (cropper) cropper.destroy();
    cropper = null;
    cropModal.classList.add("hidden");
  });
}

// confirmar corte
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
        console.log("📸 Gerou BLOB do avatar");
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

const supabase = createClient(spbs.SUPABASE_URL, spbs.SUPABASE_PUBLIC_KEY);

async function uploadAvatar(blob) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const fileName = `${user.uid}.jpg`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { upsert: true });

    if (error) {
      console.error("Erro upload Supabase:", error);
      showAlert("Failed to upload avatar.", "danger");
      return;
    }

    const { data: publicURLData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = publicURLData.publicUrl;

    avatarImg.src = avatarUrl;
    showAlert("Avatar uploaded!", "success");

    // Salva URL no Firestore
    const userRef = doc(db, COLLECTION.USERS, user.uid);
    await updateDoc(userRef, { avatarUrl });

    return avatarUrl;

  } catch (err) {
    console.error("❌ ERRO NO UPLOAD:", err);
    showAlert("Error uploading avatar.", "danger");
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

  //window.AUTH_UID = user.uid;
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

  // NEW: Format date to "03 Oct 2024 · 14:22"
  function formatDate(rawDate) {
    if (!rawDate) return "";

    // Se for Timestamp do Firestore, converte para Date
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
      newName: document.getElementById("edit-name").value,
      newPhone: document.getElementById("edit-phone").value,
    };

    try {
      await setDoc(userRef, payload, { merge: true });
      showAlert("Profile updated!", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to update profile.", "danger");
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
      showAlert("Failed to update credentials.", "danger");
    }

    showLoader(false);
  });
}

// --------------------------------------------------------
// showing-hiding password
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
const trigger = box.querySelector(".currency-select-trigger");
const options = box.querySelectorAll(".custom-option");
const selectedText = document.getElementById("currency-selected");
const hiddenInput = document.getElementById("currency-select");

trigger.addEventListener("click", () => {
  box.classList.toggle("open");
});

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

document.addEventListener("click", (e) => {
  if (!box.contains(e.target)) {
    box.classList.remove("open");
  }
});
