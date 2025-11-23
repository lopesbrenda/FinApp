// @@ static/js/profile.js
import { auth } from "./firebase-config.js";
import { addItem, getItems, updateItem } from "./firestore-utils.js";
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/**
 * Save or update user profile info in 'user_db' collection.
 */
export async function saveUserProfile(profileData) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to update your profile.");
    return;
  }

  try {
    await updateItem("user_db", user.uid, profileData);
    alert("✅ Profile updated successfully!");
  } catch (err) {
    console.error("Error updating profile:", err);
    alert("❌ Failed to update profile.");
  }
}

/**
 * Load user profile data
 */
export async function loadUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const [profile] = await getItems("user_db", user.uid);
    return profile || null;
  } catch (err) {
    console.error("Error loading profile:", err);
    return null;
  }
}

// Example: auto-load profile when logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const profile = await loadUserProfile();
    if (profile) {
      document.getElementById("profile-name").value = profile.name || "";
      document.getElementById("profile-phone").value = profile.phone || "";
      document.getElementById("profile-country").value = profile.country || "";
    }
  }
});
