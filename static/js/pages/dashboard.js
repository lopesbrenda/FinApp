import { auth, db } from "../firebase/firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { addExpense, updateExpense, deleteExpense, getUserExpenses, getCategoryIcon, getCategoryName } from "../expenses.js";
import { addGoal, getUserGoals, updateGoalAmount, updateGoal, deleteGoal, addContribution } from "../goals.js";
import { showAlert } from "../utils/alerts.js";
import { showModal } from "../utils/modal.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { expandRecurringTransactions, getRecurringLabel } from "../utils/recurring-transactions.js";
import { checkGoalNotifications } from "../utils/goal-notifications.js";
import { checkExpenseNotifications } from "../utils/expense-notifications.js";
import { showGoalCompletionModal } from "../utils/goal-completion-modal.js";
import { i18n } from "../i18n.js";
import { calculateProjection, calculateProjectionStatus, formatProjectionTime, formatExpectedDate } from "../utils/projections.js";
import { normalizeGoalRecords, persistLegacyProjectionFields } from "../utils/goal-normalizer.js";

function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'BRL': 'R$',
    'GBP': '£'
  };
  return symbols[currency] || '$';
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

let refreshDashboardTimeout = null;

function debouncedRefreshDashboard() {
  if (refreshDashboardTimeout) {
    clearTimeout(refreshDashboardTimeout);
  }
  refreshDashboardTimeout = setTimeout(() => {
    refreshDashboard();
  }, 300);
}

// Register button event listeners BEFORE auth check (so they work even without Firebase configured)
const addIncomeBtn = document.getElementById("add-income");
const addExpenseBtn = document.getElementById("add-expense");
const addGoalBtn = document.getElementById("add-goal");
const contributeGoalBtn = document.getElementById("contribute-goal");

function loadFiltersFromStorage() {
  try {
    const saved = localStorage.getItem('transactionFilters');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading filters:', e);
  }
  return {
    period: 'current_month',
    type: 'all',
    category: 'all',
    showRecurring: true
  };
}

function saveFiltersToStorage() {
  try {
    localStorage.setItem('transactionFilters', JSON.stringify(transactionFilters));
  } catch (e) {
    console.error('Error saving filters:', e);
  }
}

let transactionFilters = loadFiltersFromStorage();

console.log("🔘 Registering button event listeners...", { addIncomeBtn, addExpenseBtn, addGoalBtn, contributeGoalBtn });

if (addIncomeBtn) {
  console.log("✅ Adding event listener to + Income button");
  addIncomeBtn.addEventListener("click", () => {
    console.log("🟢 + Income button clicked!");
    showModal({
      title: "Add Income",
      type: "income",
      preselectedType: "income",
      onConfirm: async (modalInstance) => {
        try {
          if (!auth.currentUser) {
            showAlert("Please log in first.", "error");
            return false;
          }

          const amountEl = modalInstance.getField("#exp-amount");
          const categoryEl = modalInstance.getField("#exp-category");
          const typeEl = modalInstance.getField("#exp-type");
          const dateEl = modalInstance.getField("#exp-date");
          const recurringEl = modalInstance.getField("#exp-recurring");
          const notesEl = modalInstance.getField("#exp-notes");

          if (!amountEl.value || !categoryEl.value || !typeEl.value || !dateEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }

          const amount = parseFloat(amountEl.value) || 0;
          const category = categoryEl.value.trim();
          const date = dateEl.value;
          const notes = notesEl?.value?.trim() || "";
          const isRecurring = recurringEl ? recurringEl.checked : false;

          const transactionData = {
            amount,
            category,
            type: "income",
            date,
            isRecurring
          };
          
          if (notes) {
            transactionData.notes = notes;
          }

          if (isRecurring) {
            const frequencyEl = modalInstance.getField("#exp-frequency");
            const endDateEl = modalInstance.getField("#exp-end-date");
            transactionData.frequency = frequencyEl.value;
            if (endDateEl.value) {
              transactionData.endDate = endDateEl.value;
            }
          }

          await addExpense(auth.currentUser.uid, transactionData);
          
          if (transactionData.isRecurring) {
            showAlert("Recurring income created!", "success");
          } else {
            showAlert("Income added!", "success");
          }
          
          await refreshDashboard();
          return true;
        } catch (err) {
          console.error("Error adding income:", err);
          showAlert("Failed to add income.", "error");
          return false;
        }
      }
    });
  });
}

if (addExpenseBtn) {
  console.log("✅ Adding event listener to + Expense button");
  addExpenseBtn.addEventListener("click", () => {
    console.log("🔴 + Expense button clicked!");
    showModal({
      title: "Add Expense",
      type: "expense",
      preselectedType: "expense",
      onConfirm: async (modalInstance) => {
        try {
          if (!auth.currentUser) {
            showAlert("Please log in first.", "error");
            return false;
          }

          const amountEl = modalInstance.getField("#exp-amount");
          const categoryEl = modalInstance.getField("#exp-category");
          const typeEl = modalInstance.getField("#exp-type");
          const dateEl = modalInstance.getField("#exp-date");
          const paymentMethodEl = modalInstance.getField("#exp-payment-method");
          const recurringEl = modalInstance.getField("#exp-recurring");
          const notesEl = modalInstance.getField("#exp-notes");

          if (!amountEl.value || !categoryEl.value || !typeEl.value || !dateEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }

          const amount = parseFloat(amountEl.value) || 0;
          const category = categoryEl.value.trim();
          const date = dateEl.value;
          const paymentMethod = paymentMethodEl?.value;
          const notes = notesEl?.value?.trim() || "";
          
          if (!paymentMethod) {
            showAlert("Please select a payment method.", "error");
            return false;
          }
          const isRecurring = recurringEl ? recurringEl.checked : false;

          const transactionData = {
            amount,
            category,
            type: "expense",
            date,
            paymentMethod,
            isRecurring
          };
          
          if (notes) {
            transactionData.notes = notes;
          }

          if (isRecurring) {
            const frequencyEl = modalInstance.getField("#exp-frequency");
            const endDateEl = modalInstance.getField("#exp-end-date");
            transactionData.frequency = frequencyEl.value;
            if (endDateEl.value) {
              transactionData.endDate = endDateEl.value;
            }
          }

          await addExpense(auth.currentUser.uid, transactionData);
          
          if (transactionData.isRecurring) {
            showAlert("Recurring expense created!", "success");
          } else {
            showAlert("Expense added!", "success");
          }
          
          await refreshDashboard();
          return true;
        } catch (err) {
          console.error("Error adding expense:", err);
          showAlert("Failed to add expense.", "error");
          return false;
        }
      }
    });
  });
}

if (addGoalBtn) {
  console.log("✅ Adding event listener to + Goal button");
  addGoalBtn.addEventListener("click", () => {
    console.log("🔵 + Goal button clicked!");
    showModal({
      title: "Add Goal",
      type: "goal",
      onConfirm: async (modalInstance) => {
        try {
          if (!auth.currentUser) {
            showAlert("Please log in first.", "error");
            return false;
          }

          const titleEl = modalInstance.getField("#goal-title");
          const targetEl = modalInstance.getField("#goal-target");
          const dateEl = modalInstance.getField("#goal-date");
          const monthlyEl = modalInstance.getField("#goal-monthly");
          const priorityEl = modalInstance.getField("#goal-priority");

          if (!titleEl.value || !targetEl.value || !dateEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }

          const title = titleEl.value.trim();
          const targetAmount = parseFloat(targetEl.value) || 0;
          const dueDate = dateEl.value;
          const monthlyContribution = parseFloat(monthlyEl.value) || 0;
          const isPriority = priorityEl.checked;

          await addGoal(auth.currentUser.uid, title, targetAmount, dueDate, monthlyContribution, isPriority);
          await refreshDashboard();
          showAlert("Goal added!", "success");
          return true;
        } catch (err) {
          console.error("Error adding goal:", err);
          showAlert("Failed to add goal.", "error");
          return false;
        }
      }
    });
  });
}

async function handleEditGoal(goal) {
  let dueDateValue = "";
  if (goal.dueDate) {
    if (typeof goal.dueDate === 'string') {
      dueDateValue = goal.dueDate.split('T')[0];
    } else if (goal.dueDate.toDate) {
      dueDateValue = goal.dueDate.toDate().toISOString().split('T')[0];
    }
  }

  showModal({
    title: "Edit Goal",
    type: "goal",
    prefill: {
      "#goal-title": goal.title,
      "#goal-target": goal.targetAmount,
      "#goal-date": dueDateValue,
      "#goal-monthly": goal.monthlyContribution || 0,
      "#goal-priority": goal.isPriority || false
    },
    onConfirm: async (modalInstance) => {
      try {
        if (!auth.currentUser) {
          showAlert("Please log in first.", "error");
          return false;
        }

        const titleEl = modalInstance.getField("#goal-title");
        const targetEl = modalInstance.getField("#goal-target");
        const dateEl = modalInstance.getField("#goal-date");
        const monthlyEl = modalInstance.getField("#goal-monthly");
        const priorityEl = modalInstance.getField("#goal-priority");

        if (!titleEl.value || !targetEl.value || !dateEl.value) {
          showAlert("Fill all fields.", "error");
          return false;
        }

        const title = titleEl.value.trim();
        const targetAmount = parseFloat(targetEl.value) || 0;
        const dueDate = dateEl.value;
        const monthlyContribution = parseFloat(monthlyEl.value) || 0;
        const isPriority = priorityEl.checked;

        const updates = {
          title,
          targetAmount,
          dueDate,
          monthlyContribution,
          isPriority
        };
        
        const monthlyChanged = monthlyContribution !== (goal.monthlyContribution || 0);
        if (monthlyChanged) {
          const { serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js');
          updates.projectionStartAmount = goal.currentAmount || 0;
          updates.localProjectionStartAt = Date.now();
          updates.projectionStartDate = serverTimestamp();
        }

        await updateGoal(goal.id, updates);
        
        await refreshDashboard();
        showAlert("Goal updated!", "success");
        return true;
      } catch (err) {
        console.error("Error updating goal:", err);
        showAlert("Failed to update goal.", "error");
        return false;
      }
    }
  });
}

if (contributeGoalBtn) {
  console.log("✅ Adding event listener to Contribute button");
  contributeGoalBtn.addEventListener("click", () => {
    console.log("💰 Contribute button clicked!");
    
    if (!window.goals || window.goals.length === 0) {
      showAlert("No goals available. Create a goal first!", "error");
      return;
    }
    
    showModal({
      title: "Contribute to Goal",
      type: "contribute",
      onConfirm: async (modalInstance) => {
        try {
          if (!auth.currentUser) {
            showAlert("Please log in first.", "error");
            return false;
          }

          const goalEl = modalInstance.getField("#contrib-goal");
          const amountEl = modalInstance.getField("#contrib-amount");
          const operationEl = modalInstance.getField("#contrib-operation");
          const noteEl = modalInstance.getField("#contrib-note");

          if (!goalEl.value || !amountEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }

          const goalId = goalEl.value.trim();
          const rawAmount = parseFloat(amountEl.value) || 0;
          const operation = operationEl ? operationEl.value : "add";
          const note = noteEl ? noteEl.value.trim() : '';

          console.log("DEBUG Contribution:", {
            goalId,
            rawAmountValue: amountEl.value,
            rawAmount,
            operation,
            operationElValue: operationEl?.value,
            note
          });

          if (rawAmount <= 0) {
            showAlert("Amount must be greater than zero.", "error");
            return false;
          }
          
          const amount = operation === "withdraw" ? -rawAmount : rawAmount;
          console.log("DEBUG Final amount:", amount);

          const result = await addContribution(goalId, amount, note);
          await refreshDashboard();
          
          if (result.isWithdrawal) {
            showAlert("Withdrawal registered!", "success");
          } else if (result.isExtraContribution) {
            showAlert("🎉 Extra contribution added! Your projection improved.", "success");
          } else {
            showAlert("Contribution added!", "success");
          }
          
          if (result.justCompleted) {
            const goal = window.goals.find(g => g.id === goalId);
            if (goal) {
              setTimeout(() => {
                showGoalCompletionModal(goal, async (action) => {
                  await refreshDashboard();
                });
              }, 500);
            }
          }
          
          return true;
        } catch (err) {
          console.error("Error adding contribution:", err);
          showAlert("Failed to add contribution.", "error");
          return false;
        }
      }
    });
  });
}

const periodFilterEl = document.getElementById("period-filter");
if (periodFilterEl) {
  periodFilterEl.value = transactionFilters.period;
  
  periodFilterEl.addEventListener("change", (e) => {
    transactionFilters.period = e.target.value;
    saveFiltersToStorage();
    
    const periodBounds = getPeriodBounds(transactionFilters.period);
    const expenses = expandRecurringTransactions(window.rawExpenses || [], periodBounds);
    window.expenses = expenses;
    
    renderExpensesList(window.expenses || []);
  });
}

const filtersBtn = document.getElementById("filters-btn");
if (filtersBtn) {
  filtersBtn.addEventListener("click", () => {
    const allCategories = new Map();
    (window.expenses || []).forEach(exp => {
      if (exp.category && exp.type) {
        const displayName = getCategoryName(exp.category, exp.type);
        if (!allCategories.has(exp.category)) {
          allCategories.set(exp.category, displayName);
        }
      }
    });
    
    showModal({
      title: i18n.t('advanced_filters') || "Advanced Filters",
      type: "filters",
      currentFilters: transactionFilters,
      availableCategories: allCategories,
      onConfirm: async (modalInstance) => {
        const typeFilter = modalInstance.getField("#filter-type");
        const categoryFilter = modalInstance.getField("#filter-category");
        const recurringCheckbox = modalInstance.getField("#filter-recurring");
        
        if (typeFilter) transactionFilters.type = typeFilter.value;
        if (categoryFilter) transactionFilters.category = categoryFilter.value;
        if (recurringCheckbox) transactionFilters.showRecurring = recurringCheckbox.checked;
        
        saveFiltersToStorage();
        renderExpensesList(window.expenses || []);
        return true;
      }
    });
  });
}

// Auth check and data sync
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    console.log("🚫 Not logged in — redirecting to login...");
    window.location.href = "/login";
    return;
  }

  console.log("✅ User logged in:", user.email);
  
  if (!window.currency) window.currency = "USD";
  
  const userRef = doc(db, COLLECTION.USERS, user.uid);
  
  const { getDoc: getUserDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
  try {
    const userSnap = await getUserDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById("user-name").textContent = data.name || user.displayName || "User";
      window.currency = data.preferences?.currency || data.currency || "USD";
      window.userPreferences = data;
    }
  } catch (err) {
    console.warn("Failed to load user preferences:", err);
  }
  
  await refreshDashboard();
  
  onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById("user-name").textContent = data.name || user.displayName || "User";
      window.currency = data.preferences?.currency || data.currency || "USD";
      window.userPreferences = data;
      window.auth = auth;
      debouncedRefreshDashboard();
    }
  });
});

async function refreshDashboard() {
  try {
    const userId = auth.currentUser.uid;
    if (!userId) return;

    const rawExpenses = (await getUserExpenses(userId)) || [];
    window.rawExpenses = rawExpenses;
    
    const periodBounds = getPeriodBounds(transactionFilters.period);
    const expenses = expandRecurringTransactions(rawExpenses, periodBounds);
    const rawGoals = (await getUserGoals(userId)) || [];
    const goals = normalizeGoalRecords(rawGoals);
    
    persistLegacyProjectionFields(goals, updateGoal).catch(err => 
      console.warn("Background projection field persistence failed:", err)
    );

    window.expenses = expenses;
    window.goals = goals;

    renderExpensesList(expenses);
    renderGoalsList(goals);
    renderCompletedGoals(goals);
    renderArchivedGoals(goals);
    updateBalance(expenses, goals);
    updateSummary(expenses, goals);

    setTimeout(() => {
      if (goals.length > 0) {
        checkGoalNotifications(goals, window.userPreferences);
      }
      if (expenses.length > 0) {
        setTimeout(() => {
          checkExpenseNotifications(expenses, window.userPreferences);
        }, 500);
      }
    }, 1000);
  } catch (err) {
    console.error("Failed to refresh dashboard:", err);
    showAlert("Failed to refresh dashboard.", "error");
  }
}

function updateBalance(expenses = [], goals = []) {
  const symbol = getCurrencySymbol(window.currency);
  const balanceEl = document.getElementById("balance-amount");
  if (!balanceEl) return;

  const now = new Date();
  const realExpenses = expenses.filter(e => {
    if (e.virtualOccurrence) {
      return false;
    }
    const transactionDate = e.date || e.createdAt;
    const date = transactionDate?.toDate ? transactionDate.toDate() : new Date(transactionDate || Date.now());
    return date <= now;
  });

  const totalIncome = safeNumber(
    realExpenses.filter(e => e.type === "income").reduce((acc, e) => acc + safeNumber(e.amount), 0)
  );
  const totalExpenses = safeNumber(
    realExpenses.filter(e => e.type === "expense").reduce((acc, e) => acc + safeNumber(e.amount), 0)
  );
  const totalGoals = safeNumber(
    goals.reduce((acc, g) => acc + safeNumber(g.currentAmount), 0)
  );

  const balance = totalIncome - totalExpenses - totalGoals;
  balanceEl.textContent = `${symbol} ${balance.toFixed(2)}`;
}

function updateSummary(expenses = [], goals = []) {
  const symbol = getCurrencySymbol(window.currency);
  const incomeEl = document.getElementById("income-amount");
  const expensesEl = document.getElementById("expenses-amount");
  const goalsEl = document.getElementById("goals-amount");

  const now = new Date();
  const realExpenses = expenses.filter(e => {
    if (e.virtualOccurrence) {
      return false;
    }
    const transactionDate = e.date || e.createdAt;
    const date = transactionDate?.toDate ? transactionDate.toDate() : new Date(transactionDate || Date.now());
    return date <= now;
  });

  const totalIncome = safeNumber(
    realExpenses.filter(e => e.type === "income").reduce((acc, e) => acc + safeNumber(e.amount), 0)
  );
  const totalExpenses = safeNumber(
    realExpenses.filter(e => e.type === "expense").reduce((acc, e) => acc + safeNumber(e.amount), 0)
  );
  const totalGoals = safeNumber(
    goals.reduce((acc, g) => acc + safeNumber(g.targetAmount), 0)
  );

  if (incomeEl) incomeEl.textContent = `${symbol} ${totalIncome.toFixed(2)}`;
  if (expensesEl) expensesEl.textContent = `${symbol} ${totalExpenses.toFixed(2)}`;
  if (goalsEl) goalsEl.textContent = `${symbol} ${totalGoals.toFixed(2)}`;
}

function filterTransactionsByPeriod(transactions, period) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return transactions.filter(txn => {
    const txnDate = txn.date || txn.createdAt;
    let date;
    
    if (txnDate?.toDate) {
      date = txnDate.toDate();
    } else if (typeof txnDate === 'string') {
      const parts = txnDate.split('T')[0].split('-');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(txnDate);
      }
    } else {
      date = new Date(txnDate || Date.now());
    }
    
    date.setHours(0, 0, 0, 0);
    
    switch (period) {
      case 'current_month':
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return date >= monthStart && date <= monthEnd;
      
      case 'last_month':
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return date >= lastMonthStart && date <= lastMonthEnd;
      
      case 'last_3_months':
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
        threeMonthsAgo.setHours(0, 0, 0, 0);
        return date >= threeMonthsAgo && date <= now;
      
      case 'current_year':
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        return date >= yearStart && date <= yearEnd;
      
      case 'all':
      default:
        return true;
    }
  });
}

function groupTransactionsByDate(transactions) {
  const groups = {};
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  transactions.forEach(txn => {
    const txnDate = txn.date || txn.createdAt;
    let date;
    
    if (txnDate?.toDate) {
      date = txnDate.toDate();
    } else if (typeof txnDate === 'string') {
      const parts = txnDate.split('T')[0].split('-');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(txnDate);
      }
    } else {
      date = new Date(txnDate || Date.now());
    }
    
    date.setHours(0, 0, 0, 0);
    
    const isFuture = date > now;
    
    let groupKey;
    if (!isFuture && date.getTime() === now.getTime()) {
      groupKey = 'Today';
    } else if (!isFuture && date.getTime() === yesterday.getTime()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = date.toLocaleDateString();
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = { date: date, transactions: [] };
    }
    groups[groupKey].transactions.push(txn);
  });
  
  return Object.entries(groups).sort((a, b) => b[1].date - a[1].date);
}

function getPaymentMethodIcon(method) {
  const icons = {
    credit: '💳',
    debit: '💳',
    cash: '💵',
    pix: '🔷',
    bank_transfer: '🏦'
  };
  return icons[method] || '💰';
}

function getPeriodBounds(period) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let startDate, endDate;
  
  switch (period) {
    case 'current_month':
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
      break;
    
    case 'last_month':
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
      break;
    
    case 'last_3_months':
      startDate = new Date(currentYear, currentMonth - 3, 1);
      endDate = new Date(now);
      break;
    
    case 'current_year':
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
      break;
    
    case 'all':
    default:
      return null;
  }
  
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

function renderExpensesList(expenses = []) {
  if (!Array.isArray(expenses)) expenses = [];
  
  const symbol = getCurrencySymbol(window.currency);
  const container = document.getElementById("expenses-list");
  if (!container) return;

  container.innerHTML = "";
  
  const periodBounds = getPeriodBounds(transactionFilters.period);
  
  let filtered = expenses;
  
  if (periodBounds) {
    filtered = expenses.filter(exp => {
      if (exp.virtualOccurrence) {
        let expDate;
        if (typeof exp.date === 'string') {
          const parts = exp.date.split('T')[0].split('-');
          if (parts.length === 3) {
            expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            expDate = new Date(exp.date);
          }
        } else {
          expDate = new Date(exp.date);
        }
        expDate.setHours(0, 0, 0, 0);
        return expDate >= periodBounds.startDate && expDate <= periodBounds.endDate;
      } else {
        return filterTransactionsByPeriod([exp], transactionFilters.period).length > 0;
      }
    });
  }
  
  if (transactionFilters.type !== 'all') {
    filtered = filtered.filter(e => e.type === transactionFilters.type);
  }
  
  if (transactionFilters.category !== 'all') {
    filtered = filtered.filter(e => e.category === transactionFilters.category);
  }
  
  if (!transactionFilters.showRecurring) {
    filtered = filtered.filter(e => !e.virtualOccurrence);
  }

  if (!filtered.length) {
    container.innerHTML = `
      <p style="color: #999; text-align: center; padding: 40px;">
        <span data-i18n="dashboard.noTransactions">No transactions found for this period.</span>
      </p>
    `;
    return;
  }
  
  const grouped = groupTransactionsByDate(filtered);
  
  grouped.forEach(([groupLabel, groupData]) => {
    const dateHeader = document.createElement("div");
    dateHeader.style.cssText = "font-weight: 600; font-size: 0.9rem; color: #6c21e4; margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;";
    dateHeader.textContent = groupLabel;
    container.appendChild(dateHeader);
    
    groupData.transactions.forEach(exp => {
      const icon = getCategoryIcon(exp.category, exp.type);
      const categoryName = getCategoryName(exp.category, exp.type);
      const amount = safeNumber(exp.amount).toFixed(2);
      const color = exp.type === "income" ? "#4caf50" : "#f44336";
      const sign = exp.type === "income" ? "+" : "-";
      const recurringLabel = getRecurringLabel(exp);
      const paymentIcon = getPaymentMethodIcon(exp.paymentMethod);
      
      const isVirtual = exp.virtualOccurrence;
      const isFuture = exp.isPast === false;

      const div = document.createElement("div");
      div.style.cssText = `border-bottom: 1px solid #f5f5f5; padding: 14px 0; display: flex; justify-content: space-between; align-items: center; ${isFuture ? 'opacity: 0.6;' : ''}`;
      
      const recurringBadge = exp.isRecurring ? `<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 8px;">🔄 ${recurringLabel.replace('🔄 ', '')}</span>` : '';
      const futureBadge = isFuture ? `<span style="background: #fff3e0; color: #f57c00; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 8px;">Upcoming</span>` : '';
      
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <div style="font-size: 1.8rem;">${icon}</div>
          <div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 1rem;">${categoryName}</strong>
              ${recurringBadge}
              ${futureBadge}
            </div>
            <div style="color: #999; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
              <span>${paymentIcon} ${exp.paymentMethod || 'cash'}</span>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="color: ${color}; font-weight: bold; font-size: 1.1rem;">${sign} ${symbol} ${amount}</span>
          ${!isVirtual ? `<button class="btn-small btn-danger" data-id="${exp.id}" data-action="delete" data-type="${exp.type}" style="cursor: pointer;">Delete</button>` : ''}
        </div>
      `;
      
      container.appendChild(div);
    });
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const transactionType = e.target.dataset.type || "expense";
      try {
        await deleteExpense(id);
        await refreshDashboard();
        const msg = transactionType === "income" ? "Income deleted!" : "Expense deleted!";
        showAlert(msg, "success");
      } catch (err) {
        console.error("Error deleting transaction:", err);
        showAlert("Failed to delete transaction.", "error");
      }
    });
  });
}

function renderGoalsList(goals = []) {
  const symbol = getCurrencySymbol(window.currency);
  const container = document.getElementById("goals-list");
  if (!container) return;

  container.innerHTML = "";

  const activeGoals = goals.filter(g => {
    const current = safeNumber(g.currentAmount);
    const target = safeNumber(g.targetAmount);
    const isCompleted = current >= target;
    return !g.archived && !isCompleted;
  });

  if (!activeGoals.length) {
    container.innerHTML = `
      <p style="color: #999; text-align: center; padding: 40px;">
        <span data-i18n="dashboard.noGoals">No goals yet. Click + Goal to create one!</span>
      </p>
    `;
    return;
  }

  const sortedGoals = [...activeGoals].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return 0;
  });

  sortedGoals.forEach(goal => {
    const current = safeNumber(goal.currentAmount);
    const target = safeNumber(goal.targetAmount);
    const progress = target > 0 ? (current / target) * 100 : 0;
    const monthlyContribution = safeNumber(goal.monthlyContribution);
    
    const projection = calculateProjection(target, current, monthlyContribution);
    const projectionStatus = calculateProjectionStatus(goal);
    
    let dueDateStr = "No date set";
    if (goal.dueDate) {
      if (typeof goal.dueDate === 'string') {
        dueDateStr = new Date(goal.dueDate).toLocaleDateString();
      } else if (goal.dueDate.toDate) {
        dueDateStr = goal.dueDate.toDate().toLocaleDateString();
      } else {
        dueDateStr = goal.dueDate.toString();
      }
    }
    
    let projectionHTML = '';
    if (monthlyContribution > 0 && projection.expectedDate) {
      const timeRemaining = formatProjectionTime(projection.years, projection.months, {
        year: i18n.t('time.year'),
        years: i18n.t('time.years'),
        month: i18n.t('time.month'),
        months: i18n.t('time.months'),
        and: i18n.t('time.and')
      });
      
      const expectedDateStr = formatExpectedDate(projection.expectedDate, window.locale || 'en-US');
      
      let statusBadge = '';
      if (projectionStatus.status === 'ahead') {
        statusBadge = `<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">🎉 ${i18n.t('projection.ahead_schedule')}</span>`;
      } else if (projectionStatus.status === 'behind') {
        statusBadge = `<span style="background: #ff9800; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">⚠️ ${i18n.t('projection.behind_schedule')}</span>`;
      } else if (projectionStatus.status === 'on-track') {
        statusBadge = `<span style="background: #2196F3; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">✓ ${i18n.t('projection.on_track')}</span>`;
      }
      
      projectionHTML = `
        <p style="color: #666; font-size: 0.85rem; margin: 4px 0;">
          🔮 <span data-i18n="projection.estimated">Estimated</span>: ${expectedDateStr}${statusBadge}
        </p>
        <p style="color: #999; font-size: 0.8rem; margin: 4px 0;">
          📅 ${timeRemaining} <span data-i18n="projection.remaining">remaining</span>
        </p>
      `;
    } else if (monthlyContribution > 0) {
      projectionHTML = `
        <p style="color: #999; font-size: 0.85rem; margin: 4px 0;">
          💡 <span data-i18n="projection.set_monthly">Set monthly contribution to see projection</span>
        </p>
      `;
    }

    const div = document.createElement("div");
    div.style.cssText = `border: 1px solid ${goal.isPriority ? '#FFD700' : '#eee'}; border-left: 4px solid ${goal.isPriority ? '#FFD700' : '#2196F3'}; border-radius: 8px; padding: 16px; margin-bottom: 16px; ${goal.isPriority ? 'background: linear-gradient(to right, #fffef7, white);' : ''}`;
    
    const actionButtons = `
      <button class="btn-small" data-id="${goal.id}" data-action="edit" style="background: #6c21e4; color: white; cursor: pointer;">Edit</button>
      <button class="btn-small btn-danger" data-id="${goal.id}" data-action="delete" style="cursor: pointer;">Delete</button>
    `;
    
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <strong>${goal.isPriority ? '⭐ ' : '🎯 '}${goal.title}</strong>
          <p style="color: #666; font-size: 0.9rem; margin: 4px 0;">Due: ${dueDateStr}</p>
          ${projectionHTML}
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${actionButtons}
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: ${goal.isPriority ? '#FFD700' : '#2196F3'}; height: 100%; width: ${Math.min(progress, 100)}%;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
        <span>${symbol} ${current.toFixed(2)} / ${symbol} ${target.toFixed(2)}</span>
        <span>${Math.min(progress, 100).toFixed(0)}%</span>
      </div>
    `;
    
    container.appendChild(div);
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      const goal = goals.find(g => g.id === id);
      
      if (action === "edit") {
        if (goal) {
          await handleEditGoal(goal);
        }
      } else if (action === "delete") {
        try {
          await deleteGoal(id);
          await refreshDashboard();
          showAlert("Goal deleted!", "success");
        } catch (err) {
          console.error("Error deleting goal:", err);
          showAlert("Failed to delete goal.", "error");
        }
      } else if (action === "mark-achieved") {
        try {
          const { markAsAchieved } = await import('../goals.js');
          await markAsAchieved(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_archived_success'), 'success');
        } catch (err) {
          console.error("Error marking goal as achieved:", err);
          showAlert(i18n.t('goal_archived_error'), 'error');
        }
      } else if (action === "restart") {
        try {
          const { restartGoal } = await import('../goals.js');
          await restartGoal(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_restarted_success'), 'success');
        } catch (err) {
          console.error("Error restarting goal:", err);
          showAlert(i18n.t('goal_restarted_error'), 'error');
        }
      } else if (action === "archive") {
        try {
          const { archiveGoal } = await import('../goals.js');
          await archiveGoal(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_archived_success'), 'success');
        } catch (err) {
          console.error("Error archiving goal:", err);
          showAlert(i18n.t('goal_archived_error'), 'error');
        }
      }
    });
  });
}

function renderCompletedGoals(goals = []) {
  const symbol = getCurrencySymbol(window.currency);
  const container = document.getElementById("completed-goals-list");
  if (!container) return;

  container.innerHTML = "";

  const completedGoals = goals.filter(g => {
    const current = safeNumber(g.currentAmount);
    const target = safeNumber(g.targetAmount);
    const isCompleted = current >= target;
    return isCompleted && !g.archived;
  });

  if (!completedGoals.length) {
    container.innerHTML = `
      <p style="color: #999; text-align: center; padding: 40px;">
        <span data-i18n="no_completed_goals">No completed goals yet. Complete your first goal to see it here!</span>
      </p>
    `;
    return;
  }

  completedGoals.forEach(goal => {
    const current = safeNumber(goal.currentAmount);
    const target = safeNumber(goal.targetAmount);
    const progress = target > 0 ? (current / target) * 100 : 0;
    
    let completedDateStr = "Unknown";
    if (goal.completedAt) {
      completedDateStr = new Date(goal.completedAt).toLocaleDateString();
    } else if (goal.archivedAt) {
      completedDateStr = new Date(goal.archivedAt).toLocaleDateString();
    }
    
    let timeToComplete = "Unknown";
    if (goal.createdAt && goal.completedAt) {
      const created = goal.createdAt.seconds ? new Date(goal.createdAt.seconds * 1000) : new Date(goal.createdAt);
      const completed = new Date(goal.completedAt);
      const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
      timeToComplete = `${days} ${days === 1 ? i18n.t('day') : i18n.t('days')}`;
    }

    const div = document.createElement("div");
    div.style.cssText = "border: 1px solid #27ae60; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: linear-gradient(135deg, #f0fff4 0%, #e8f8f0 100%);";
    
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <strong>✅ ${goal.title}</strong>
          <p style="color: #27ae60; font-size: 0.85rem; font-weight: 600; margin: 4px 0;">🎉 Goal Completed!</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-small" data-id="${goal.id}" data-action="mark-achieved" style="background: #27ae60; color: white; cursor: pointer;" data-i18n="mark_as_achieved">Mark as Achieved</button>
          <button class="btn-small" data-id="${goal.id}" data-action="restart" style="background: #e67e22; color: white; cursor: pointer;" data-i18n="restart_goal">Restart</button>
          <button class="btn-small" data-id="${goal.id}" data-action="archive" style="background: #3498db; color: white; cursor: pointer;" data-i18n="archive_goal">Archive</button>
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="background: #c8e6c9; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: #27ae60; height: 100%; width: ${Math.min(progress, 100)}%;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
        <span>${symbol} ${current.toFixed(2)} / ${symbol} ${target.toFixed(2)}</span>
        <span>${Math.min(progress, 100).toFixed(0)}%</span>
      </div>
    `;
    
    container.appendChild(div);
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      
      if (action === "mark-achieved") {
        try {
          const { markAsAchieved } = await import('../goals.js');
          await markAsAchieved(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_archived_success'), 'success');
        } catch (err) {
          console.error("Error marking goal as achieved:", err);
          showAlert(i18n.t('goal_archived_error'), 'error');
        }
      } else if (action === "restart") {
        try {
          const { restartGoal } = await import('../goals.js');
          await restartGoal(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_restarted_success'), 'success');
        } catch (err) {
          console.error("Error restarting goal:", err);
          showAlert(i18n.t('goal_restarted_error'), 'error');
        }
      } else if (action === "archive") {
        try {
          const { archiveGoal } = await import('../goals.js');
          await archiveGoal(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_archived_success'), 'success');
        } catch (err) {
          console.error("Error archiving goal:", err);
          showAlert(i18n.t('goal_archived_error'), 'error');
        }
      }
    });
  });
}

function renderArchivedGoals(goals = []) {
  const symbol = getCurrencySymbol(window.currency);
  const container = document.getElementById("archived-goals-list");
  if (!container) return;

  container.innerHTML = "";

  const archivedGoals = goals.filter(g => g.archived);

  if (!archivedGoals.length) {
    container.innerHTML = `
      <p style="color: #999; text-align: center; padding: 40px;">
        <span data-i18n="no_archived_goals">No archived goals yet. Archive a completed goal to see it here!</span>
      </p>
    `;
    return;
  }

  archivedGoals.forEach(goal => {
    const current = safeNumber(goal.currentAmount);
    const target = safeNumber(goal.targetAmount);
    const progress = target > 0 ? (current / target) * 100 : 0;
    
    let completedDateStr = "Unknown";
    if (goal.completedAt) {
      completedDateStr = new Date(goal.completedAt).toLocaleDateString();
    } else if (goal.archivedAt) {
      completedDateStr = new Date(goal.archivedAt).toLocaleDateString();
    }
    
    let timeToComplete = "Unknown";
    if (goal.createdAt && goal.completedAt) {
      const created = goal.createdAt.seconds ? new Date(goal.createdAt.seconds * 1000) : new Date(goal.createdAt);
      const completed = new Date(goal.completedAt);
      const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
      timeToComplete = `${days} ${days === 1 ? i18n.t('day') : i18n.t('days')}`;
    }

    const div = document.createElement("div");
    div.style.cssText = "border: 1px solid #95a5a6; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f1 100%); opacity: 0.85;";
    
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <strong>📁 ${goal.title}</strong>
          <p style="color: #666; font-size: 0.85rem; margin: 4px 0;">
            <span data-i18n="completed_on">Completed on</span>: ${completedDateStr}
          </p>
          <p style="color: #666; font-size: 0.85rem; margin: 4px 0;">
            <span data-i18n="time_to_complete">Time to complete</span>: ${timeToComplete}
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-small" data-id="${goal.id}" data-action="unarchive" style="background: #3498db; color: white; cursor: pointer;" data-i18n="unarchive">Unarchive</button>
          <button class="btn-small btn-danger" data-id="${goal.id}" data-action="delete" style="cursor: pointer;">Delete</button>
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="background: #d5dbdb; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: #7f8c8d; height: 100%; width: ${Math.min(progress, 100)}%;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
        <span>${symbol} ${current.toFixed(2)} / ${symbol} ${target.toFixed(2)}</span>
        <span>${Math.min(progress, 100).toFixed(0)}%</span>
      </div>
    `;
    
    container.appendChild(div);
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      
      if (action === "unarchive") {
        try {
          const { unarchiveGoal } = await import('../goals.js');
          await unarchiveGoal(id);
          await refreshDashboard();
          showAlert(i18n.t('goal_restarted_success'), 'success');
        } catch (err) {
          console.error("Error unarchiving goal:", err);
          showAlert(i18n.t('goal_restarted_error'), 'error');
        }
      } else if (action === "delete") {
        try {
          await deleteGoal(id);
          await refreshDashboard();
          showAlert("Goal deleted!", "success");
        } catch (err) {
          console.error("Error deleting goal:", err);
          showAlert("Failed to delete goal.", "error");
        }
      }
    });
  });
}

document.querySelectorAll('.goal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    document.querySelectorAll('.goal-tab').forEach(t => {
      t.classList.remove('active');
      t.style.color = '#999';
      t.style.borderBottomColor = 'transparent';
    });
    
    tab.classList.add('active');
    tab.style.color = '#6c21e4';
    tab.style.borderBottomColor = '#6c21e4';
    
    document.querySelectorAll('.goals-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    if (tabName === 'active') {
      document.getElementById('active-goals-container').style.display = 'block';
    } else if (tabName === 'completed') {
      document.getElementById('completed-goals-container').style.display = 'block';
    } else if (tabName === 'archived') {
      document.getElementById('archived-goals-container').style.display = 'block';
    }
  });
});
