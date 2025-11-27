import { db } from "./firebase/firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";
import { logActivity } from "./services/activity-log.js";

export async function addGoal(userId, title, targetAmount, dueDate, monthlyContribution = 0, isPriority = false) {
  try {
    const now = Date.now();
    const goalData = {
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
    };
    
    const docRef = await addDoc(collection(db, COLLECTION.GOALS), goalData);
    
    await logActivity("added_goal", COLLECTION.GOAL, docRef.id, null, {
      ...goalData,
      id: docRef.id,
      name: title
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

export async function deleteGoal(goalId, goalName) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    
    let name = goalName;
    if (!name) {
      try {
        const snap = await getDoc(goalRef);
        if (snap.exists()) {
          name = snap.data().title;
        }
      } catch (e) {}
    }
    
    let beforeData = null;
    try {
      const snap = await getDoc(goalRef);
      if (snap.exists()) beforeData = { id: goalId, ...snap.data() };
    } catch (e) {}
    
    await deleteDoc(goalRef);
    
    await logActivity("deleted_goal", COLLECTION.GOAL, goalId, beforeData, null);
    
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
    
    const actionName = isWithdrawal ? "withdrawal_goal" : "contribution_goal";
    await logActivity(actionName, COLLECTION.GOALS, goalId, 
      { currentAmount: data.currentAmount || 0, name: data.title },
      { currentAmount: total, amount: Math.abs(contributionAmount), name: data.title }
    );
    
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

export async function markAsAchieved(goalId, goalName) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    
    let name = goalName;
    if (!name) {
      try {
        const snap = await getDoc(goalRef);
        if (snap.exists()) {
          name = snap.data().title;
        }
      } catch (e) {}
    }
    
    let beforeData = null;
    try {
      const snap = await getDoc(goalRef);
      if (snap.exists()) beforeData = { id: goalId, ...snap.data() };
    } catch (e) {}
    
    await updateDoc(goalRef, {
      completedAt: new Date().toISOString(),
      achieved: true
    });
    
    await logActivity("completed_goal", COLLECTION.GOALS, goalId, beforeData, {
      ...beforeData,
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
    
    await logActivity("archived_goal", COLLECTION.GOALS, goalId, 
      { id: goalId, ...data },
      { id: goalId, ...data, archived: true }
    );
    
    return true;
  } catch (error) {
    console.error("Error archiving goal:", error);
    throw error;
  }
}

export async function unarchiveGoal(goalId) {
  try {
    const goalRef = doc(db, COLLECTION.GOALS, goalId);
    
    let name;
    try {
      const snap = await getDoc(goalRef);
      if (snap.exists()) {
        name = snap.data().title;
      }
    } catch (e) {}
    
    let beforeData = null;
    try {
      const snap = await getDoc(goalRef);
      if (snap.exists()) beforeData = { id: goalId, ...snap.data() };
    } catch (e) {}
    
    await updateDoc(goalRef, {
      archived: false,
      archivedAt: null
    });
    
    await logActivity("unarchived_goal", COLLECTION.GOALS, goalId, beforeData, {
      ...beforeData,
      archived: false
    });
    
    return true;
  } catch (error) {
    console.error("Error unarchiving goal:", error);
    throw error;
  }
}
