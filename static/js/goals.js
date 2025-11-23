import { db } from "./firebase/firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";

export async function addGoal(userId, title, targetAmount, dueDate) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION.GOALS), {
      uid: userId,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: 0,
      dueDate,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding goal:", error);
    throw error;
  }
}

export async function getUserGoals(userId) {
  try {
    const q = query(collection(db, COLLECTION.GOALS), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting goals:", error);
    return [];
  }
}

export async function updateGoalAmount(goalId, newAmount) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await updateDoc(goalRef, { currentAmount: Number(newAmount) });
    return true;
  } catch (error) {
    console.error("Error updating goal amount:", error);
    throw error;
  }
}

export async function deleteGoal(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await deleteDoc(goalRef);
    return true;
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
}

export async function addContribution(goalId, amount) {
  try {
    const contributionAmount = Number(amount);
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      throw new Error("Invalid contribution amount");
    }
    
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await updateDoc(goalRef, {
      contributions: arrayUnion({ 
        date: new Date().toISOString(), 
        amount: contributionAmount 
      })
    });
    
    const snap = await getDoc(goalRef);
    const data = snap.data();
    
    const total = (data.contributions || []).reduce((sum, c) => {
      const amt = Number(c.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    
    await updateDoc(goalRef, { currentAmount: total });
    return true;
  } catch (error) {
    console.error("Error adding contribution:", error);
    throw error;
  }
}
