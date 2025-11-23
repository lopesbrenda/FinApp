// static/js/expenses.js
import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/** Adiciona uma despesa ou receita */
export async function addExpense(userId, amount, category, type, note) {
  try {
    await addDoc(collection(db, "expenses"), {
      userId,
      amount: Number(amount),
      category,
      type, // "expense" ou "income"
      note: note || "",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Erro ao adicionar despesa:", err);
    throw err;
  }
}

/** Retorna todas as despesas do usuário */
export async function getUserExpenses(userId) {
  const q = query(collection(db, "expenses"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/** Deleta uma despesa */
export async function deleteExpense(expenseId) {
  await deleteDoc(doc(db, "expenses", expenseId));
}
