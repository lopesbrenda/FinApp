// static/js/goals.js
import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/** Adiciona uma meta */
export async function addGoal(userId, title, targetAmount, dueDate) {
  await addDoc(collection(db, "goals"), {
    userId,
    title,
    targetAmount: Number(targetAmount),
    currentAmount: 0,
    dueDate,
    createdAt: serverTimestamp(),
  });
}

/** Retorna metas do usuário */
export async function getUserGoals(userId) {
  const q = query(collection(db, "goals"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/** Atualiza o progresso da meta */
export async function updateGoalAmount(goalId, newAmount) {
  const goalRef = doc(db, "goals", goalId);
  await updateDoc(goalRef, { currentAmount: Number(newAmount) });
}
