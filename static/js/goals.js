import { db } from "./firebase/firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";

export async function addGoal(userId, title, targetAmount, dueDate, monthlyContribution = 0, isPriority = false) {
  try {
    const now = Date.now();
    const docRef = await addDoc(collection(db, COLLECTION.GOALS), {
      uid: userId,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: 0,
      dueDate,
      monthlyContribution: Number(monthlyContribution) || 0,
      isPriority: isPriority || false,
      localProjectionStartAt: now,
      projectionStartDate: serverTimestamp(),
      projectionStartAmount: 0,
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

export async function updateGoal(goalId, updates) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await updateDoc(goalRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating goal:", error);
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

export async function addContribution(goalId, amount, note = '') {
  try {
    const contributionAmount = Number(amount);
    if (isNaN(contributionAmount) || contributionAmount === 0) {
      throw new Error("Invalid contribution amount");
    }
    
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    const contribution = { 
      date: new Date().toISOString(), 
      amount: contributionAmount,
      note: note || ''
    };
    
    await updateDoc(goalRef, {
      contributions: arrayUnion(contribution)
    });
    
    const snap = await getDoc(goalRef);
    const data = snap.data();
    
    const total = (data.contributions || []).reduce((sum, c) => {
      const amt = Number(c.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    
    const now = Date.now();
    const updates = { 
      currentAmount: total,
      projectionStartAmount: total,
      localProjectionStartAt: now,
      projectionStartDate: serverTimestamp()
    };
    
    if (!data.projectionStartDate && !data.localProjectionStartAt) {
      updates.localProjectionStartAt = now;
      updates.projectionStartDate = serverTimestamp();
      updates.projectionStartAmount = 0;
    }
    
    await updateDoc(goalRef, updates);
    
    const justCompleted = total >= data.targetAmount && (!data.completedAt);
    
    const isWithdrawal = contributionAmount < 0;
    const isExtraContribution = contributionAmount > (data.monthlyContribution || 0) && contributionAmount > 0;
    
    return { 
      success: true, 
      justCompleted, 
      currentAmount: total, 
      targetAmount: data.targetAmount,
      isWithdrawal,
      isExtraContribution
    };
  } catch (error) {
    console.error("Error adding contribution:", error);
    throw error;
  }
}

export async function markAsAchieved(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await updateDoc(goalRef, {
      completedAt: new Date().toISOString(),
      achieved: true
    });
    return true;
  } catch (error) {
    console.error("Error marking goal as achieved:", error);
    throw error;
  }
}

export async function restartGoal(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await updateDoc(goalRef, {
      currentAmount: 0,
      completedAt: null,
      achieved: false,
      archived: false,
      contributions: []
    });
    return true;
  } catch (error) {
    console.error("Error restarting goal:", error);
    throw error;
  }
}

export async function archiveGoal(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    const snap = await getDoc(goalRef);
    const data = snap.data();
    
    await updateDoc(goalRef, {
      archived: true,
      archivedAt: new Date().toISOString(),
      completedAt: data.completedAt || new Date().toISOString(),
      achieved: true
    });
    return true;
  } catch (error) {
    console.error("Error archiving goal:", error);
    throw error;
  }
}

export async function unarchiveGoal(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    await updateDoc(goalRef, {
      archived: false,
      archivedAt: null
    });
    return true;
  } catch (error) {
    console.error("Error unarchiving goal:", error);
    throw error;
  }
}
