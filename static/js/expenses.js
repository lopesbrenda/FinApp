import { db } from "./firebase/firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";
import { logActivity } from "./services/activity-log.js";

export const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: "🍔" },
  { id: "transport", name: "Transportation", icon: "🚗" },
  { id: "shopping", name: "Shopping", icon: "🛍️" },
  { id: "entertainment", name: "Entertainment", icon: "🎬" },
  { id: "bills", name: "Bills & Utilities", icon: "💡" },
  { id: "health", name: "Healthcare", icon: "🏥" },
  { id: "education", name: "Education", icon: "📚" },
  { id: "travel", name: "Travel", icon: "✈️" },
  { id: "other", name: "Other", icon: "📝" }
];

export const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary", icon: "💼" },
  { id: "freelance", name: "Freelance", icon: "💻" },
  { id: "investment", name: "Investment", icon: "📈" },
  { id: "business", name: "Business", icon: "🏢" },
  { id: "gift", name: "Gift", icon: "🎁" },
  { id: "bonus", name: "Bonus", icon: "💰" },
  { id: "refund", name: "Refund", icon: "↩️" },
  { id: "other", name: "Other Income", icon: "💵" }
];

export async function addExpense(userId, transactionData) {
  try {
    const data = {
      uid: userId,
      amount: Number(transactionData.amount || transactionData),
      category: transactionData.category,
      type: transactionData.type,
      date: transactionData.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    };
    
    if (transactionData.isRecurring) {
      data.isRecurring = true;
      data.frequency = transactionData.frequency;
      if (transactionData.endDate) {
        data.endDate = transactionData.endDate;
      }
    }
    
    if (transactionData.description) {
      data.description = transactionData.description;
    }
    if (transactionData.method) {
      data.method = transactionData.method;
    }
    
    const docRef = await addDoc(collection(db, COLLECTION.TRANSACTIONS), data);
    
    const actionName = data.type === 'income' ? 'added_income' : 'added_expense';
    await logActivity(actionName, COLLECTION.TRANSACTIONS, docRef.id, null, {
      ...data,
      id: docRef.id
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
}

export async function getUserExpenses(userId) {
  try {
    const q = query(collection(db, COLLECTION.TRANSACTIONS), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting expenses:", error);
    return [];
  }
}

export async function updateExpense(expenseId, amount, category, type, description) {
  try {
    const expenseRef = doc(db, COLLECTION.TRANSACTIONS, expenseId);
    
    let beforeData = null;
    try {
      const snap = await getDoc(expenseRef);
      if (snap.exists()) beforeData = { id: expenseId, ...snap.data() };
    } catch (e) {}
    
    await updateDoc(expenseRef, {
      amount: Number(amount),
      category,
      type
    });
    
    const actionName = type === 'income' ? 'updated_income' : 'updated_expense';
    await logActivity(actionName, COLLECTION.TRANSACTIONS, expenseId, beforeData, {
      id: expenseId,
      amount: Number(amount),
      category,
      type,
      note: description || category
    });
    
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
}

export async function deleteExpense(expenseId, description) {
  try {
    const expenseRef = doc(db, COLLECTION.TRANSACTIONS, expenseId);
    
    let beforeData = null;
    try {
      const docSnap = await getDoc(expenseRef);
      if (docSnap.exists()) {
        beforeData = { id: expenseId, ...docSnap.data() };
      }
    } catch (e) {}
    
    await deleteDoc(expenseRef);
    
    const actionName = beforeData?.type === 'income' ? 'deleted_income' : 'deleted_expense';
    await logActivity(actionName, COLLECTION.TRANSACTIONS, expenseId, beforeData, null);
    
    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

export function getCategoryIcon(categoryId, type) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customCategories = window.userPreferences?.customCategories || [];
  
  let category = categories.find(c => c.id === categoryId);
  if (!category) {
    category = customCategories.find(c => c.id === categoryId);
  }
  
  return category ? category.icon : "📝";
}

export function getCategoryName(categoryId, type) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const customCategories = window.userPreferences?.customCategories || [];
  
  let category = categories.find(c => c.id === categoryId);
  if (!category) {
    category = customCategories.find(c => c.id === categoryId);
  }
  
  return category ? category.name : categoryId;
}
