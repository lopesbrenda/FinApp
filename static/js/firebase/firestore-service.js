/**
 * Firestore Service - Client-side CRUD operations
 * 
 * This file contains all Firebase Firestore operations performed from the frontend.
 * Functions here communicate directly with Firebase Firestore database.
 * 
 * Service layer: JS → this file → Firebase
 */

import { db } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp,
  arrayUnion,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "./firebase-dbs.js";

// ==================== TRANSACTIONS (Income & Expenses) ====================

/**
 * Add a new transaction (income or expense)
 * @param {string} userId - User ID
 * @param {number} amount - Transaction amount
 * @param {string} category - Category ID
 * @param {string} type - "income" or "expense"
 * @returns {Promise<string>} Document ID
 */
export async function addTransaction(userId, amount, category, type) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION.TRANSACTIONS), {
      uid: userId,
      amount: Number(amount),
      category,
      type,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Transaction added: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding transaction:", error);
    throw error;
  }
}

/**
 * Get all transactions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of transactions
 */
export async function getUserTransactions(userId) {
  try {
    const q = query(collection(db, COLLECTION.TRANSACTIONS), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📄 Fetched ${transactions.length} transactions for user ${userId}`);
    return transactions;
  } catch (error) {
    console.error("❌ Error getting transactions:", error);
    return [];
  }
}

/**
 * Update a transaction
 * @param {string} transactionId - Transaction document ID
 * @param {number} amount - New amount
 * @param {string} category - New category
 * @param {string} type - "income" or "expense"
 * @returns {Promise<boolean>} Success status
 */
export async function updateTransaction(transactionId, amount, category, type) {
  try {
    const transactionRef = doc(db, COLLECTION.TRANSACTIONS, transactionId);
    await updateDoc(transactionRef, {
      amount: Number(amount),
      category,
      type
    });
    console.log(`✏️ Transaction updated: ${transactionId}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating transaction:", error);
    throw error;
  }
}

/**
 * Delete a transaction
 * @param {string} transactionId - Transaction document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTransaction(transactionId) {
  try {
    const transactionRef = doc(db, COLLECTION.TRANSACTIONS, transactionId);
    await deleteDoc(transactionRef);
    console.log(`🗑️ Transaction deleted: ${transactionId}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting transaction:", error);
    throw error;
  }
}

// ==================== GOALS ====================

/**
 * Add a new financial goal
 * @param {string} userId - User ID
 * @param {string} title - Goal title
 * @param {number} targetAmount - Target amount
 * @param {string} dueDate - Due date (ISO format)
 * @returns {Promise<string>} Document ID
 */
export async function addGoal(userId, title, targetAmount, dueDate) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION.BUDGET), {
      uid: userId,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: 0,
      dueDate,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Goal added: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding goal:", error);
    throw error;
  }
}

/**
 * Get all goals for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of goals
 */
export async function getUserGoals(userId) {
  try {
    const q = query(collection(db, COLLECTION.BUDGET), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📄 Fetched ${goals.length} goals for user ${userId}`);
    return goals;
  } catch (error) {
    console.error("❌ Error getting goals:", error);
    return [];
  }
}

/**
 * Update goal current amount
 * @param {string} goalId - Goal document ID
 * @param {number} newAmount - New current amount
 * @returns {Promise<boolean>} Success status
 */
export async function updateGoalAmount(goalId, newAmount) {
  try {
    const goalRef = doc(db, COLLECTION.BUDGET, goalId);
    await updateDoc(goalRef, { currentAmount: Number(newAmount) });
    console.log(`✏️ Goal amount updated: ${goalId}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating goal amount:", error);
    throw error;
  }
}

/**
 * Update goal details
 * @param {string} goalId - Goal document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateGoal(goalId, updates) {
  try {
    const goalRef = doc(db, COLLECTION.BUDGET, goalId);
    await updateDoc(goalRef, updates);
    console.log(`✏️ Goal updated: ${goalId}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating goal:", error);
    throw error;
  }
}

/**
 * Delete a goal
 * @param {string} goalId - Goal document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteGoal(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.BUDGET, goalId);
    await deleteDoc(goalRef);
    console.log(`🗑️ Goal deleted: ${goalId}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting goal:", error);
    throw error;
  }
}

/**
 * Add contribution to a goal
 * @param {string} goalId - Goal document ID
 * @param {number} amount - Contribution amount
 * @returns {Promise<boolean>} Success status
 */
export async function addContribution(goalId, amount) {
  try {
    const goalRef = doc(db, COLLECTION.BUDGET, goalId);
    await updateDoc(goalRef, {
      contributions: arrayUnion({ date: new Date().toISOString(), amount: Number(amount) })
    });
    
    const snap = await getDoc(goalRef);
    const data = snap.data();
    const total = (data.contributions || []).reduce((sum, c) => sum + c.amount, 0);
    
    await updateDoc(goalRef, { currentAmount: total });
    console.log(`💰 Contribution added to goal: ${goalId}`);
    return true;
  } catch (error) {
    console.error("❌ Error adding contribution:", error);
    throw error;
  }
}

// ==================== USER DATA ====================

/**
 * Get user data from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export async function getUserData(userId) {
  try {
    const userRef = doc(db, COLLECTION.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log(`📄 User data fetched: ${userId}`);
      return userSnap.data();
    } else {
      console.log(`⚠️ User not found: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting user data:", error);
    return null;
  }
}

/**
 * Update user data in Firestore
 * @param {string} userId - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserData(userId, data) {
  try {
    const userRef = doc(db, COLLECTION.USERS, userId);
    await updateDoc(userRef, data);
    console.log(`✏️ User data updated: ${userId}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating user data:", error);
    throw error;
  }
}
