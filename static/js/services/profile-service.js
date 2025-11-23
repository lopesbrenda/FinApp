import { auth, db, storage } from "../firebase/firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";

export const profileService = {
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userId, ...userSnap.data() };
      }
      
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  async updateUserProfile(userId, data) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      await updateDoc(userRef, data);
      
      if (data.name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  },

  async uploadAvatar(userId, file) {
    try {
      const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await this.updateUserProfile(userId, { avatar: downloadURL });
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return null;
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No user logged in");
      }
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  }
};
