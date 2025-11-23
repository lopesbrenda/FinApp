import { db } from "./firebase/firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";

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
    
    const docRef = await addDoc(collection(db, COLLECTION.TRANSACTIONS), data);
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

export async function updateExpense(expenseId, amount, category, type) {
  try {
    const expenseRef = doc(db, COLLECTION.TRANSACTIONS, expenseId);
    await updateDoc(expenseRef, {
      amount: Number(amount),
      category,
      type
    });
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
}

export async function deleteExpense(expenseId) {
  try {
    const expenseRef = doc(db, COLLECTION.TRANSACTIONS, expenseId);
    await deleteDoc(expenseRef);
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
