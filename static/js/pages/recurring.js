import { auth, db } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { showAlert } from "../utils/alerts.js";
import { showModal } from "../utils/modal.js";
import { getCategoryName } from "../expenses.js";

let currencySymbol = '$';
let allRecurring = [];
let currentFilter = 'all';

function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `${currencySymbol}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function parseDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue.toDate) return dateValue.toDate();
  if (dateValue.seconds) return new Date(dateValue.seconds * 1000);
  if (typeof dateValue === 'string') return new Date(dateValue);
  if (dateValue instanceof Date) return dateValue;
  return null;
}

function getNextOccurrence(transaction) {
  const startDate = parseDate(transaction.date);
  if (!startDate) return null;
  
  const now = new Date();
  const frequency = transaction.frequency || 'monthly';
  let next = new Date(startDate);
  
  while (next <= now) {
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
  }
  
  const endDate = parseDate(transaction.endDate);
  if (endDate && next > endDate) {
    return null;
  }
  
  return next;
}

function getFrequencyLabel(frequency) {
  const labels = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'yearly': 'Yearly'
  };
  return labels[frequency] || 'Monthly';
}

function calculateMonthlyCost(transaction) {
  const amount = parseFloat(transaction.amount) || 0;
  const frequency = transaction.frequency || 'monthly';
  
  switch (frequency) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4.33;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

async function loadRecurringTransactions(userId) {
  try {
    const q = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where("uid", "==", userId),
      where("isRecurring", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading recurring transactions:", error);
    return [];
  }
}

async function loadUserPreferences(userId) {
  try {
    const userDoc = await getDoc(doc(db, COLLECTION.USERS, userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.preferences?.currency) {
        currencySymbol = data.preferences.currency;
      }
    }
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
}

function updateSummary(transactions) {
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  
  transactions.forEach(t => {
    const monthly = calculateMonthlyCost(t);
    if (t.type === 'income') {
      monthlyIncome += monthly;
    } else {
      monthlyExpenses += monthly;
    }
  });
  
  document.getElementById('recurring-income').textContent = formatCurrency(monthlyIncome);
  document.getElementById('recurring-expenses').textContent = formatCurrency(monthlyExpenses);
  
  const netEl = document.getElementById('recurring-net');
  const net = monthlyIncome - monthlyExpenses;
  netEl.textContent = formatCurrency(net);
  netEl.className = 'summary-value ' + (net >= 0 ? 'positive' : 'negative');
}

function renderRecurringList(transactions) {
  const container = document.getElementById('recurring-list');
  const emptyState = document.getElementById('empty-state');
  
  let filtered = transactions;
  if (currentFilter === 'income') {
    filtered = transactions.filter(t => t.type === 'income');
  } else if (currentFilter === 'expenses') {
    filtered = transactions.filter(t => t.type === 'expense');
  }
  
  if (filtered.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  container.style.display = 'block';
  emptyState.style.display = 'none';
  
  filtered.sort((a, b) => {
    const nextA = getNextOccurrence(a);
    const nextB = getNextOccurrence(b);
    if (!nextA) return 1;
    if (!nextB) return -1;
    return nextA - nextB;
  });
  
  container.innerHTML = filtered.map(t => {
    const next = getNextOccurrence(t);
    const nextStr = next ? next.toLocaleDateString() : 'Ended';
    const isActive = next !== null;
    const catName = getCategoryName(t.category, t.type);
    const monthly = calculateMonthlyCost(t);
    const endDate = parseDate(t.endDate);
    const endStr = endDate ? endDate.toLocaleDateString() : '';
    
    return `
      <div class="recurring-item ${t.type} ${!isActive ? 'ended' : ''}">
        <div class="recurring-item-main">
          <div class="recurring-item-icon">
            ${t.type === 'income' ? '📈' : '📉'}
          </div>
          <div class="recurring-item-info">
            <h4 class="recurring-item-category">${catName}</h4>
            <p class="recurring-item-meta">
              <span class="frequency-badge">${getFrequencyLabel(t.frequency)}</span>
              ${t.notes ? `<span class="notes">${t.notes}</span>` : ''}
            </p>
          </div>
        </div>
        <div class="recurring-item-details">
          <div class="recurring-amount ${t.type}">
            ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
          </div>
          <div class="recurring-monthly">
            ${formatCurrency(monthly)}/mo
          </div>
          <div class="recurring-next">
            <span class="next-label">Next:</span>
            <span class="next-date ${!isActive ? 'ended' : ''}">${nextStr}</span>
          </div>
          ${endStr ? `<div class="recurring-end">Ends: ${endStr}</div>` : ''}
        </div>
        <div class="recurring-actions">
          <button class="btn-icon edit-recurring" data-id="${t.id}" title="Edit">✏️</button>
          <button class="btn-icon delete-recurring" data-id="${t.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.edit-recurring').forEach(btn => {
    btn.addEventListener('click', () => editRecurring(btn.dataset.id));
  });
  
  container.querySelectorAll('.delete-recurring').forEach(btn => {
    btn.addEventListener('click', () => deleteRecurring(btn.dataset.id));
  });
}

async function editRecurring(id) {
  const transaction = allRecurring.find(t => t.id === id);
  if (!transaction) return;
  
  showModal({
    title: 'Edit Recurring Transaction',
    type: 'expense',
    editData: transaction,
    onConfirm: async (modalInstance) => {
      try {
        const amountEl = modalInstance.getField('#exp-amount');
        const notesEl = modalInstance.getField('#exp-notes');
        const frequencyEl = modalInstance.getField('#exp-frequency');
        const endDateEl = modalInstance.getField('#exp-end-date');
        
        const updates = {};
        
        if (amountEl?.value) {
          updates.amount = parseFloat(amountEl.value);
        }
        if (notesEl) {
          updates.notes = notesEl.value.trim();
        }
        if (frequencyEl?.value) {
          updates.frequency = frequencyEl.value;
        }
        if (endDateEl?.value) {
          updates.endDate = new Date(endDateEl.value);
        }
        
        const docRef = doc(db, COLLECTION.TRANSACTIONS, id);
        await updateDoc(docRef, updates);
        
        const idx = allRecurring.findIndex(t => t.id === id);
        if (idx !== -1) {
          allRecurring[idx] = { ...allRecurring[idx], ...updates };
        }
        
        updateSummary(allRecurring);
        renderRecurringList(allRecurring);
        showAlert('Transaction updated!', 'success');
        return true;
      } catch (error) {
        console.error('Error updating transaction:', error);
        showAlert('Failed to update transaction.', 'error');
        return false;
      }
    }
  });
}

async function deleteRecurring(id) {
  const confirmed = confirm('Are you sure you want to delete this recurring transaction?');
  if (!confirmed) return;
  
  try {
    await deleteDoc(doc(db, COLLECTION.TRANSACTIONS, id));
    allRecurring = allRecurring.filter(t => t.id !== id);
    updateSummary(allRecurring);
    renderRecurringList(allRecurring);
    showAlert('Transaction deleted!', 'success');
  } catch (error) {
    console.error('Error deleting transaction:', error);
    showAlert('Failed to delete transaction.', 'error');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.tab;
      renderRecurringList(allRecurring);
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user && user.emailVerified) {
    await loadUserPreferences(user.uid);
    allRecurring = await loadRecurringTransactions(user.uid);
    
    updateSummary(allRecurring);
    renderRecurringList(allRecurring);
    setupTabs();
  }
});
