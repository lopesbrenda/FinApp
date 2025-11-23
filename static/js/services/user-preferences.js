import { db } from "../firebase/firebase-config.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";

export const userPreferencesService = {
  async getUserPreferences(userId) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      
      const defaultPreferences = {
        currency: "USD",
        language: "en",
        theme: "light",
        customCategories: [],
        paymentMethods: [
          { id: "credit", name: "Credit Card", icon: "💳" },
          { id: "debit", name: "Debit Card", icon: "💳" },
          { id: "cash", name: "Cash", icon: "💵" }
        ],
        notifications: {
          expenseAlerts: true,
          goalAlerts: true
        }
      };
      
      await setDoc(userRef, defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error("Error getting user preferences:", error);
      return null;
    }
  },

  async updateCurrency(userId, currency) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      await updateDoc(userRef, { currency });
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
      return true;
    } catch (error) {
      console.error("Error updating currency:", error);
      return false;
    }
  },

  async updateLanguage(userId, language) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      await updateDoc(userRef, { language });
      localStorage.setItem('language', language);
      return true;
    } catch (error) {
      console.error("Error updating language:", error);
      return false;
    }
  },

  async updateNotifications(userId, notifications) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      await updateDoc(userRef, { notifications });
      return true;
    } catch (error) {
      console.error("Error updating notifications:", error);
      return false;
    }
  },

  async updateTheme(userId, theme) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      await updateDoc(userRef, { theme });
      return true;
    } catch (error) {
      console.error("Error updating theme:", error);
      return false;
    }
  },

  async addCustomCategory(userId, category) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      const currentCategories = userSnap.exists() && userSnap.data().customCategories 
        ? userSnap.data().customCategories 
        : [];
      
      const isDuplicate = currentCategories.some(c => 
        c.id === category.id || (c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type)
      );
      
      if (isDuplicate) {
        console.warn("Category already exists");
        return false;
      }
      
      const updatedCategories = [...currentCategories, category];
      
      if (userSnap.exists()) {
        await updateDoc(userRef, { customCategories: updatedCategories });
      } else {
        await setDoc(userRef, { customCategories: updatedCategories }, { merge: true });
      }
      
      if (window.userPreferences) {
        window.userPreferences.customCategories = updatedCategories;
      }
      
      return true;
    } catch (error) {
      console.error("Error adding custom category:", error);
      throw error;
    }
  },

  async addPaymentMethod(userId, paymentMethod) {
    try {
      const userRef = doc(db, COLLECTION.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      const currentMethods = userSnap.exists() && userSnap.data().paymentMethods 
        ? userSnap.data().paymentMethods 
        : [
            { id: "credit", name: "Credit Card", icon: "💳" },
            { id: "debit", name: "Debit Card", icon: "💳" },
            { id: "cash", name: "Cash", icon: "💵" }
          ];
      
      const isDuplicate = currentMethods.some(m => 
        m.id === paymentMethod.id || m.name.toLowerCase() === paymentMethod.name.toLowerCase()
      );
      
      if (isDuplicate) {
        console.warn("Payment method already exists");
        return false;
      }
      
      const updatedMethods = [...currentMethods, paymentMethod];
      
      if (userSnap.exists()) {
        await updateDoc(userRef, { paymentMethods: updatedMethods });
      } else {
        await setDoc(userRef, { paymentMethods: updatedMethods }, { merge: true });
      }
      
      if (window.userPreferences) {
        window.userPreferences.paymentMethods = updatedMethods;
      }
      
      return true;
    } catch (error) {
      console.error("Error adding payment method:", error);
      throw error;
    }
  }
};
