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

          if (!titleEl.value || !targetEl.value || !dateEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }

          const title = titleEl.value.trim();
          const targetAmount = parseFloat(targetEl.value) || 0;
          const dueDate = dateEl.value;

          await addGoal(auth.currentUser.uid, title, targetAmount, dueDate);
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
      "#goal-date": dueDateValue
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

        if (!titleEl.value || !targetEl.value || !dateEl.value) {
          showAlert("Fill all fields.", "error");
          return false;
        }

        const title = titleEl.value.trim();
        const targetAmount = parseFloat(targetEl.value) || 0;
        const dueDate = dateEl.value;

        await updateGoal(goal.id, {
          title,
          targetAmount,
          dueDate
        });
        
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

          if (!goalEl.value || !amountEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }

          const goalId = goalEl.value.trim();
          const amount = parseFloat(amountEl.value) || 0;

          if (amount <= 0) {
            showAlert("Amount must be greater than 0.", "error");
            return false;
          }

          await addContribution(goalId, amount);
          await refreshDashboard();
          showAlert("Contribution added!", "success");
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

// Auth check and data sync
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    console.log("🚫 Not logged in — redirecting to login...");
    window.location.href = "/login";
    return;
  }

  console.log("✅ User logged in:", user.email);
  
  if (!window.currency) window.currency = "USD";
  await refreshDashboard();
  
  const userRef = doc(db, COLLECTION.USERS, user.uid);
  onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById("user-name").textContent = data.name || user.displayName || "User";
      window.currency = data.currency || "USD";
      window.userPreferences = data;
      window.auth = auth;
      debouncedRefreshDashboard();
    }
  });
});

let hasCheckedNotifications = false;

async function refreshDashboard() {
  try {
    const userId = auth.currentUser.uid;
    if (!userId) return;

    const rawExpenses = (await getUserExpenses(userId)) || [];
    const expenses = expandRecurringTransactions(rawExpenses);
    const goals = (await getUserGoals(userId)) || [];

    window.expenses = expenses;
    window.goals = goals;

    renderExpensesList(expenses);
    renderGoalsList(goals);
    updateBalance(expenses, goals);
    updateSummary(expenses, goals);

    if (!hasCheckedNotifications) {
      hasCheckedNotifications = true;
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
    }
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

function renderExpensesList(expenses = []) {
  const symbol = getCurrencySymbol(window.currency);
  const container = document.getElementById("expenses-list");
  if (!container) return;

  container.innerHTML = "";

  if (!expenses.length) {
    container.innerHTML = `
      <p style="color: #999; text-align: center; padding: 40px;">
        <span data-i18n="dashboard.noTransactions">No transactions yet. Click + Income or + Expense to start!</span>
      </p>
    `;
    return;
  }

  expenses.forEach(exp => {
    const icon = getCategoryIcon(exp.category, exp.type);
    const categoryName = getCategoryName(exp.category, exp.type);
    const amount = safeNumber(exp.amount).toFixed(2);
    const color = exp.type === "income" ? "#4caf50" : "#f44336";
    const sign = exp.type === "income" ? "+" : "-";
    const recurringLabel = getRecurringLabel(exp);
    
    const transactionDate = exp.date || exp.createdAt;
    const createdDate = transactionDate?.toDate ? transactionDate.toDate() : new Date(transactionDate || Date.now());
    const dateStr = createdDate.toLocaleDateString();
    
    const isVirtual = exp.virtualOccurrence;
    const isFuture = exp.isPast === false;

    const div = document.createElement("div");
    div.style.cssText = `border-bottom: 1px solid #eee; padding: 16px 0; display: flex; justify-content: space-between; align-items: center; ${isFuture ? 'opacity: 0.6; font-style: italic;' : ''}`;
    
    div.innerHTML = `
      <div>
        <strong>${icon} ${categoryName}</strong>
        ${recurringLabel ? `<span style="font-size: 0.85rem; color: #2196F3; margin-left: 8px;">${recurringLabel}</span>` : ''}
        ${isFuture ? `<span style="font-size: 0.75rem; color: #999; margin-left: 8px;">(Upcoming)</span>` : ''}
        <p style="color: #666; font-size: 0.9rem; margin: 4px 0;">${dateStr}</p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="color: ${color}; font-weight: bold;">${sign} ${symbol} ${amount}</span>
        ${!isVirtual ? `<button class="btn-small btn-danger" data-id="${exp.id}" data-action="delete" data-type="${exp.type}">Delete</button>` : ''}
      </div>
    `;
    
    container.appendChild(div);
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

  if (!goals.length) {
    container.innerHTML = `
      <p style="color: #999; text-align: center; padding: 40px;">
        <span data-i18n="dashboard.noGoals">No goals yet. Click + Goal to create one!</span>
      </p>
    `;
    return;
  }

  goals.forEach(goal => {
    const current = safeNumber(goal.currentAmount);
    const target = safeNumber(goal.targetAmount);
    const progress = target > 0 ? (current / target) * 100 : 0;
    
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

    const div = document.createElement("div");
    div.style.cssText = "border: 1px solid #eee; border-radius: 8px; padding: 16px; margin-bottom: 16px;";
    
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <strong>🎯 ${goal.title}</strong>
          <p style="color: #666; font-size: 0.9rem; margin: 4px 0;">Due: ${dueDateStr}</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-small" data-id="${goal.id}" data-action="edit" style="background: #6c21e4; color: white;">Edit</button>
          <button class="btn-small btn-danger" data-id="${goal.id}" data-action="delete">Delete</button>
        </div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: #2196F3; height: 100%; width: ${progress}%;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #666;">
        <span>${symbol} ${current.toFixed(2)} / ${symbol} ${target.toFixed(2)}</span>
        <span>${progress.toFixed(0)}%</span>
      </div>
    `;
    
    container.appendChild(div);
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      
      if (action === "edit") {
        const goal = goals.find(g => g.id === id);
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
      }
    });
  });
}
