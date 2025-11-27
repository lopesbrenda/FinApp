import { auth, db } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function logActivity(action, collectionName, documentId, before = null, after = null) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, COLLECTION.ACTIVITY_LOG), {
      userId: user.uid,
      action: action,
      collectionName: collectionName,
      documentId: documentId || null,
      before: before,
      after: after,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export async function getRecentActivity(userId, limitCount = 3) {
  try {
    const q = query(
      collection(db, COLLECTION.ACTIVITY_LOG),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    return logs.slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

export async function getActivityLogs(userId, filters = {}) {
  try {
    console.log("🔍 Fetching activity logs for userId:", userId);
    console.log("🔍 Collection:", COLLECTION.ACTIVITY_LOG);
    
    const q = query(
      collection(db, COLLECTION.ACTIVITY_LOG),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    console.log("🔍 Found", snapshot.size, "logs");
    
    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    logs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    if (filters.period) {
      const now = new Date();
      let startDate;
      
      switch (filters.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        logs = logs.filter(log => {
          const logDate = log.createdAt?.toDate?.() || new Date(log.createdAt);
          return logDate >= startDate;
        });
      }
    }

    if (filters.actionType && filters.actionType !== 'all') {
      logs = logs.filter(log => {
        const action = log.action || '';
        switch (filters.actionType) {
          case 'transaction':
            return action.includes('expense') || action.includes('income') || action.includes('transaction');
          case 'goal':
            return action.includes('goal');
          case 'settings':
            return action.includes('settings') || action.includes('preference');
          case 'auth':
            return action.includes('login') || action.includes('logout');
          default:
            return true;
        }
      });
    }

    if (filters.entity && filters.entity !== 'all') {
      logs = logs.filter(log => {
        const colName = log.collectionName || '';
        switch (filters.entity) {
          case 'transaction':
            return colName.includes('transaction');
          case 'goal':
            return colName.includes('goal');
          case 'settings':
            return colName.includes('settings') || colName.includes('user');
          case 'profile':
            return colName.includes('user') || colName.includes('profile');
          default:
            return true;
        }
      });
    }

    return logs;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
}

export function groupLogsByDate(logs) {
  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  logs.forEach(log => {
    const logDate = log.createdAt?.toDate?.() || new Date(log.createdAt);
    if (!logDate) return;

    let dateKey;
    const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (logDay.getTime() === todayDay.getTime()) {
      dateKey = 'today';
    } else if (logDay.getTime() === yesterdayDay.getTime()) {
      dateKey = 'yesterday';
    } else {
      dateKey = logDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(log);
  });

  return groups;
}

export function getActivityIcon(action) {
  const actionLower = (action || '').toLowerCase();
  
  if (actionLower.includes('added') || actionLower.includes('created')) {
    if (actionLower.includes('goal')) return '🟢';
    return '🟣';
  }
  if (actionLower.includes('updated') || actionLower.includes('edited')) return '🔵';
  if (actionLower.includes('deleted')) return '🔴';
  if (actionLower.includes('completed')) return '🏆';
  if (actionLower.includes('archived')) return '📦';
  if (actionLower.includes('unarchived')) return '📂';
  if (actionLower.includes('contribution')) return '💰';
  if (actionLower.includes('withdrawal')) return '💸';
  if (actionLower.includes('settings') || actionLower.includes('preference')) return '🟠';
  if (actionLower.includes('login')) return '🔐';
  if (actionLower.includes('logout')) return '👋';
  if (actionLower.includes('profile')) return '👤';
  
  return '⚪';
}

export function formatActivityMessage(log, translations = {}) {
  const t = (key, fallback) => translations[key] || fallback;
  const action = (log.action || '').toLowerCase();
  const before = log.before || {};
  const after = log.after || {};
  const data = after || before;
  
  const amount = data.amount || before.amount || '';
  const category = data.category || before.category || '';
  const note = data.note || before.note || '';
  const name = data.name || before.name || '';
  const type = data.type || before.type || '';
  
  const description = note || category || name || '';
  
  if (action.includes('added_expense') || action.includes('created_expense')) {
    return `${t('activity.transaction_added', 'Expense added')}: "${description}" -${amount}`;
  }
  if (action.includes('added_income') || action.includes('created_income')) {
    return `${t('activity.transaction_added', 'Income added')}: "${description}" +${amount}`;
  }
  if (action.includes('updated_expense') || action.includes('edited_expense')) {
    return `${t('activity.transaction_edited', 'Expense edited')}: "${description}"`;
  }
  if (action.includes('updated_income') || action.includes('edited_income')) {
    return `${t('activity.transaction_edited', 'Income edited')}: "${description}"`;
  }
  if (action.includes('deleted_expense')) {
    return `${t('activity.transaction_deleted', 'Expense deleted')}: "${description}" -${amount}`;
  }
  if (action.includes('deleted_income')) {
    return `${t('activity.transaction_deleted', 'Income deleted')}: "${description}" +${amount}`;
  }
  
  if (action.includes('added_goal') || action.includes('created_goal')) {
    return `${t('activity.goal_created', 'Goal created')}: "${name}"`;
  }
  if (action.includes('updated_goal') || action.includes('edited_goal')) {
    return `${t('activity.goal_edited', 'Goal edited')}: "${name}"`;
  }
  if (action.includes('deleted_goal')) {
    return `${t('activity.goal_deleted', 'Goal deleted')}: "${name}"`;
  }
  if (action.includes('completed_goal')) {
    return `${t('activity.goal_completed', 'Goal completed')}: "${name}" 🎉`;
  }
  if (action.includes('archived_goal')) {
    return `${t('activity.goal_archived', 'Goal archived')}: "${name}"`;
  }
  if (action.includes('unarchived_goal')) {
    return `${t('activity.goal_unarchived', 'Goal unarchived')}: "${name}"`;
  }
  if (action.includes('contribution')) {
    return `${t('activity.contribution', 'Contribution to goal')}: "${name}" +${amount}`;
  }
  if (action.includes('withdrawal')) {
    return `${t('activity.withdrawal', 'Withdrawal from goal')}: "${name}" -${amount}`;
  }
  
  if (action.includes('settings') || action.includes('preference')) {
    return `${t('activity.settings_changed', 'Settings changed')}`;
  }
  if (action.includes('profile')) {
    return `${t('activity.profile_updated', 'Profile updated')}`;
  }
  if (action.includes('login')) {
    return t('activity.login', 'Logged in');
  }
  if (action.includes('logout')) {
    return t('activity.logout', 'Logged out');
  }
  
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
