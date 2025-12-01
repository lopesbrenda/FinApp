import { auth, db } from "../firebase/firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { addExpense, getUserExpenses } from "../expenses.js";
import { addGoal, getUserGoals, addContribution } from "../goals.js";
import { showAlert } from "../utils/alerts.js";
import { showModal } from "../utils/modal.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { showGoalCompletionModal } from "../utils/goal-completion-modal.js";
import { validateAmount } from "../services/currency-service.js";
import { subscribeToAccounts } from "../services/accounts-service.js";

function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'BRL': 'R$',
    'GBP': '£'
  };
  return symbols[currency] || '€';
}

let accountsUnsubscribe = null;
window.accounts = [];
window.goals = [];
window.currency = "EUR";

function updateAccountsSummary(accounts) {
  window.accounts = accounts;
  const symbol = getCurrencySymbol(window.currency);
  
  const bankAccounts = accounts.filter(a => 
    a.type === 'checking' || a.type === 'savings' || a.type === 'debit_card' || a.type === 'investment'
  );
  const creditCards = accounts.filter(a => a.type === 'credit_card');
  const cashAccounts = accounts.filter(a => a.type === 'cash');
  
  const bankTotal = bankAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const creditDebt = creditCards.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const cashTotal = cashAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const netWorth = bankTotal + cashTotal - creditDebt;
  
  const accountBalanceEl = document.getElementById("account-balance-amount");
  if (accountBalanceEl) accountBalanceEl.textContent = `${symbol} ${netWorth.toFixed(2)}`;
  
  const bankBalanceEl = document.getElementById("bank-balance-amount");
  if (bankBalanceEl) bankBalanceEl.textContent = `${symbol} ${bankTotal.toFixed(2)}`;
  
  const creditDebtEl = document.getElementById("credit-debt-amount");
  if (creditDebtEl) creditDebtEl.textContent = `${symbol} ${creditDebt.toFixed(2)}`;
  
  const cashBalanceEl = document.getElementById("cash-balance-amount");
  if (cashBalanceEl) cashBalanceEl.textContent = `${symbol} ${cashTotal.toFixed(2)}`;
}

function updateGoalsSummary(goals) {
  window.goals = goals;
  
  const activeGoals = goals.filter(g => !g.isCompleted && !g.isArchived);
  const goalCount = activeGoals.length;
  
  let avgProgress = 0;
  if (goalCount > 0) {
    const totalProgress = activeGoals.reduce((sum, g) => {
      const current = Number(g.currentAmount) || 0;
      const target = Number(g.targetAmount) || 1;
      return sum + (current / target * 100);
    }, 0);
    avgProgress = Math.round(totalProgress / goalCount);
  }
  
  const goalsSummaryEl = document.getElementById("goals-summary");
  if (goalsSummaryEl) {
    goalsSummaryEl.textContent = `${goalCount} goal${goalCount !== 1 ? 's' : ''}`;
  }
  
  const goalsProgressEl = document.getElementById("goals-progress");
  if (goalsProgressEl) {
    goalsProgressEl.textContent = `${avgProgress}% avg progress`;
  }
}

function updateFinancialSummary(expenses) {
  const symbol = getCurrencySymbol(window.currency);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthExpenses = expenses.filter(e => {
    const date = e.date ? new Date(e.date) : null;
    if (!date) return false;
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  let income = 0;
  let expenseTotal = 0;
  
  monthExpenses.forEach(e => {
    const amount = Number(e.convertedAmount) || Number(e.amount) || 0;
    if (e.type === 'income') {
      income += amount;
    } else if (e.type === 'expense') {
      expenseTotal += amount;
    }
  });
  
  const balance = income - expenseTotal;
  
  const incomeEl = document.getElementById("income-amount");
  if (incomeEl) incomeEl.textContent = `${symbol} ${income.toFixed(2)}`;
  
  const expensesEl = document.getElementById("expenses-amount");
  if (expensesEl) expensesEl.textContent = `${symbol} ${expenseTotal.toFixed(2)}`;
  
  const balanceEl = document.getElementById("balance-amount");
  if (balanceEl) {
    balanceEl.textContent = `${symbol} ${balance.toFixed(2)}`;
    balanceEl.style.color = balance >= 0 ? '#4caf50' : '#f44336';
  }
}

const addIncomeBtn = document.getElementById("add-income");
const addExpenseBtn = document.getElementById("add-expense");
const addGoalBtn = document.getElementById("add-goal");
const contributeGoalBtn = document.getElementById("contribute-goal");

if (addIncomeBtn) {
  addIncomeBtn.addEventListener("click", () => {
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
          const dateEl = modalInstance.getField("#exp-date");
          const currencyEl = modalInstance.getField("#exp-currency");
          const accountEl = modalInstance.getField("#exp-account");
          const recurringEl = modalInstance.getField("#exp-recurring");
          const notesEl = modalInstance.getField("#exp-notes");

          if (!amountEl.value || !categoryEl.value || !dateEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }
          
          const accountId = accountEl?.value || "";
          if (!accountId) {
            showAlert("Please select an account.", "error");
            return false;
          }

          const validation = validateAmount(amountEl.value);
          if (!validation.valid) {
            showAlert(validation.error, "error");
            return false;
          }
          
          const transactionData = {
            amount: validation.value,
            category: categoryEl.value.trim(),
            type: "income",
            date: dateEl.value,
            currency: currencyEl?.value || "EUR",
            accountId,
            isRecurring: recurringEl ? recurringEl.checked : false
          };
          
          if (notesEl?.value?.trim()) {
            transactionData.notes = notesEl.value.trim();
          }

          if (transactionData.isRecurring) {
            const frequencyEl = modalInstance.getField("#exp-frequency");
            const endDateEl = modalInstance.getField("#exp-end-date");
            transactionData.frequency = frequencyEl.value;
            if (endDateEl.value) transactionData.endDate = endDateEl.value;
          }

          await addExpense(auth.currentUser.uid, transactionData);
          showAlert(transactionData.isRecurring ? "Recurring income created!" : "Income added!", "success");
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
  addExpenseBtn.addEventListener("click", () => {
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
          const dateEl = modalInstance.getField("#exp-date");
          const currencyEl = modalInstance.getField("#exp-currency");
          const paymentMethodEl = modalInstance.getField("#exp-payment-method");
          const accountEl = modalInstance.getField("#exp-account");
          const recurringEl = modalInstance.getField("#exp-recurring");
          const notesEl = modalInstance.getField("#exp-notes");

          if (!amountEl.value || !categoryEl.value || !dateEl.value) {
            showAlert("Fill all fields.", "error");
            return false;
          }
          
          const accountId = accountEl?.value || "";
          if (!accountId) {
            showAlert("Please select an account.", "error");
            return false;
          }

          const validation = validateAmount(amountEl.value);
          if (!validation.valid) {
            showAlert(validation.error, "error");
            return false;
          }
          
          const paymentMethod = paymentMethodEl?.value;
          if (!paymentMethod) {
            showAlert("Please select a payment method.", "error");
            return false;
          }

          const transactionData = {
            amount: validation.value,
            category: categoryEl.value.trim(),
            type: "expense",
            date: dateEl.value,
            currency: currencyEl?.value || "EUR",
            paymentMethod,
            accountId,
            isRecurring: recurringEl ? recurringEl.checked : false
          };
          
          if (notesEl?.value?.trim()) {
            transactionData.notes = notesEl.value.trim();
          }

          if (transactionData.isRecurring) {
            const frequencyEl = modalInstance.getField("#exp-frequency");
            const endDateEl = modalInstance.getField("#exp-end-date");
            transactionData.frequency = frequencyEl.value;
            if (endDateEl.value) transactionData.endDate = endDateEl.value;
          }

          await addExpense(auth.currentUser.uid, transactionData);
          showAlert(transactionData.isRecurring ? "Recurring expense created!" : "Expense added!", "success");
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
  addGoalBtn.addEventListener("click", () => {
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

          await addGoal(
            auth.currentUser.uid,
            titleEl.value.trim(),
            parseFloat(targetEl.value) || 0,
            dateEl.value,
            parseFloat(monthlyEl.value) || 0,
            priorityEl.checked
          );
          
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

if (contributeGoalBtn) {
  contributeGoalBtn.addEventListener("click", () => {
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

          if (rawAmount <= 0) {
            showAlert("Amount must be greater than zero.", "error");
            return false;
          }
          
          const amount = operation === "withdraw" ? -rawAmount : rawAmount;

          const result = await addContribution(goalId, amount, note);
          await refreshDashboard();
          
          if (result.isWithdrawal) {
            showAlert("Withdrawal registered!", "success");
          } else if (result.isExtraContribution) {
            showAlert("Extra contribution added!", "success");
          } else {
            showAlert("Contribution added!", "success");
          }
          
          if (result.justCompleted) {
            const goal = window.goals.find(g => g.id === goalId);
            if (goal) {
              setTimeout(() => {
                showGoalCompletionModal(goal, async () => {
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

async function refreshDashboard() {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const expenses = (await getUserExpenses(userId)) || [];
    const goals = (await getUserGoals(userId)) || [];
    
    updateFinancialSummary(expenses);
    updateGoalsSummary(goals);
  } catch (err) {
    console.error("Failed to refresh dashboard:", err);
  }
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (accountsUnsubscribe) {
      accountsUnsubscribe();
      accountsUnsubscribe = null;
    }
    window.location.href = "/login";
    return;
  }

  console.log("✅ User logged in:", user.email);
  
  const userRef = doc(db, COLLECTION.USERS, user.uid);
  
  try {
    const { getDoc: getUserDoc } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
    const userSnap = await getUserDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById("user-name").textContent = data.name || user.displayName || "User";
      window.currency = data.preferences?.currency || data.currency || "EUR";
    }
  } catch (err) {
    console.warn("Failed to load user preferences:", err);
  }
  
  await refreshDashboard();
  
  if (accountsUnsubscribe) accountsUnsubscribe();
  accountsUnsubscribe = subscribeToAccounts(user.uid, (accounts) => {
    updateAccountsSummary(accounts);
  });
  
  onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById("user-name").textContent = data.name || user.displayName || "User";
      window.currency = data.preferences?.currency || data.currency || "EUR";
      refreshDashboard();
    }
  });
});
