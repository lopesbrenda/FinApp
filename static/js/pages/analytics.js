import { auth, db } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { showAlert } from "../utils/alerts.js";
import { showModal } from "../utils/modal.js";
import { addExpense, updateExpense, deleteExpense, getUserExpenses, getCategoryIcon, getCategoryName } from "../expenses.js";
import { addGoal, getUserGoals, updateGoal, deleteGoal, addContribution } from "../goals.js";
import { validateAmount } from "../services/currency-service.js";
import { expandRecurringTransactions, getRecurringLabel } from "../utils/recurring-transactions.js";
import { showGoalCompletionModal } from "../utils/goal-completion-modal.js";
import { calculateProjection, formatProjectionTime, formatExpectedDate } from "../utils/projections.js";
import { normalizeGoalRecords } from "../utils/goal-normalizer.js";

const Chart = window.Chart;

let monthlyChart = null;
let categoryChart = null;
let trendChart = null;
let currencySymbol = '€';
let allTransactions = [];
let allGoals = [];
window.goals = [];
window.accounts = [];

function getCurrencySymbol(currency) {
  const symbols = { 'USD': '$', 'EUR': '€', 'BRL': 'R$', 'GBP': '£' };
  return symbols[currency] || '€';
}

const chartColors = [
  '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#14b8a6', '#eab308', '#a855f7', '#22c55e'
];

function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `${currencySymbol} ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function getPeriodBounds(period) {
  const now = new Date();
  let start, end;
  
  switch (period) {
    case 'current_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'last_3_months':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'current_year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      start = new Date(2020, 0, 1);
      end = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59);
  }
  
  return { start, end };
}

function parseDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue.toDate) return dateValue.toDate();
  if (dateValue.seconds) return new Date(dateValue.seconds * 1000);
  if (typeof dateValue === 'string') return new Date(dateValue);
  if (dateValue instanceof Date) return dateValue;
  return null;
}

function filterTransactions(transactions, period) {
  const bounds = getPeriodBounds(period);
  return transactions.filter(t => {
    const date = parseDate(t.date);
    if (!date) return false;
    return date >= bounds.start && date <= bounds.end;
  });
}

async function loadTransactions(userId) {
  try {
    const q = query(collection(db, COLLECTION.TRANSACTIONS), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading transactions:", error);
    return [];
  }
}

async function loadGoals(userId) {
  try {
    const q = query(collection(db, COLLECTION.GOALS), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading goals:", error);
    return [];
  }
}

async function loadAccounts(userId) {
  try {
    const q = query(collection(db, COLLECTION.ACCOUNTS), where("uid", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading accounts:", error);
    return [];
  }
}

async function loadUserPreferences(userId) {
  try {
    const userDoc = await getDoc(doc(db, COLLECTION.USERS, userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.preferences?.currency) {
        currencySymbol = getCurrencySymbol(data.preferences.currency);
      }
    }
  } catch (error) {
    console.error("Error loading preferences:", error);
  }
}

function calculateSummary(transactions) {
  let totalIncome = 0;
  let totalExpenses = 0;
  
  transactions.forEach(t => {
    const amount = parseFloat(t.convertedAmount) || parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      totalExpenses += amount;
    }
  });
  
  return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
}

function updateSummaryDisplay(summary) {
  const incomeEl = document.getElementById('total-income');
  const expensesEl = document.getElementById('total-expenses');
  const balanceEl = document.getElementById('net-balance');
  
  if (incomeEl) incomeEl.textContent = formatCurrency(summary.totalIncome);
  if (expensesEl) expensesEl.textContent = formatCurrency(summary.totalExpenses);
  
  if (balanceEl) {
    balanceEl.textContent = formatCurrency(summary.netBalance);
    balanceEl.className = 'stat-value ' + (summary.netBalance >= 0 ? 'positive' : 'negative');
  }
}

function getMonthlyData(transactions, period) {
  const bounds = getPeriodBounds(period);
  const months = {};
  
  let current = new Date(bounds.start);
  while (current <= bounds.end) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    months[key] = { income: 0, expenses: 0 };
    current.setMonth(current.getMonth() + 1);
  }
  
  transactions.forEach(t => {
    const date = parseDate(t.date);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) {
      const amount = parseFloat(t.convertedAmount) || parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        months[key].income += amount;
      } else {
        months[key].expenses += amount;
      }
    }
  });
  
  const labels = Object.keys(months).sort();
  const incomeData = labels.map(k => months[k].income);
  const expenseData = labels.map(k => months[k].expenses);
  
  const monthNames = labels.map(k => {
    const [year, month] = k.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  });
  
  return { labels: monthNames, incomeData, expenseData };
}

function getCategoryData(transactions) {
  const categories = {};
  
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const catName = getCategoryName(t.category, 'expense');
    if (!categories[catName]) categories[catName] = 0;
    categories[catName] += parseFloat(t.convertedAmount) || parseFloat(t.amount) || 0;
  });
  
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  return {
    labels: sorted.map(([name]) => name),
    data: sorted.map(([, amount]) => amount),
    total: sorted.reduce((sum, [, amount]) => sum + amount, 0)
  };
}

function getTrendData(transactions, period) {
  const dayData = {};
  
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const date = parseDate(t.date);
    if (!date) return;
    const key = date.toISOString().split('T')[0];
    if (!dayData[key]) dayData[key] = 0;
    dayData[key] += parseFloat(t.convertedAmount) || parseFloat(t.amount) || 0;
  });
  
  const sortedDays = Object.keys(dayData).sort();
  let cumulative = 0;
  const cumulativeData = sortedDays.map(day => {
    cumulative += dayData[day];
    return cumulative;
  });
  
  const labels = sortedDays.map(d => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
  
  return { labels, data: cumulativeData };
}

function renderMonthlyChart(data) {
  const ctx = document.getElementById('monthly-chart');
  if (!ctx) return;
  
  if (monthlyChart) monthlyChart.destroy();
  
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        { label: 'Income', data: data.incomeData, backgroundColor: '#10b981', borderRadius: 6 },
        { label: 'Expenses', data: data.expenseData, backgroundColor: '#ef4444', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, callback: (v) => formatCurrency(v) }, grid: { color: gridColor } }
      }
    }
  });
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  
  if (categoryChart) categoryChart.destroy();
  
  const isDark = document.body.classList.contains('dark-mode');
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.data,
        backgroundColor: chartColors.slice(0, data.labels.length),
        borderWidth: 2,
        borderColor: isDark ? '#1a1a1a' : '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const percent = ((context.parsed / data.total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(context.parsed)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
  
  renderCategoryLegend(data);
}

function renderCategoryLegend(data) {
  const legend = document.getElementById('category-legend');
  if (!legend) return;
  
  legend.innerHTML = data.labels.map((label, i) => {
    const percent = ((data.data[i] / data.total) * 100).toFixed(1);
    return `<div class="legend-item"><span class="legend-color" style="background: ${chartColors[i]}"></span><span class="legend-label">${label}</span><span class="legend-value">${percent}%</span></div>`;
  }).join('');
}

function renderTrendChart(data) {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;
  
  if (trendChart) trendChart.destroy();
  
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Cumulative Expenses',
        data: data.data,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, maxTicksLimit: 10 }, grid: { display: false } },
        y: { ticks: { color: textColor, callback: (v) => formatCurrency(v) }, grid: { color: gridColor } }
      }
    }
  });
}

function renderTopCategories(transactions) {
  const container = document.getElementById('top-categories-list');
  if (!container) return;
  
  const categoryData = getCategoryData(transactions);
  
  if (categoryData.labels.length === 0) {
    container.innerHTML = '<p class="no-data">No data available</p>';
    return;
  }
  
  container.innerHTML = categoryData.labels.slice(0, 5).map((label, i) => {
    const amount = categoryData.data[i];
    const percent = ((amount / categoryData.total) * 100).toFixed(1);
    return `<div class="top-item"><div class="top-item-info"><span class="top-item-rank">${i + 1}</span><span class="top-item-name">${label}</span></div><div class="top-item-stats"><span class="top-item-amount">${formatCurrency(amount)}</span><span class="top-item-percent">${percent}%</span></div><div class="top-item-bar"><div class="top-item-fill" style="width: ${percent}%; background: ${chartColors[i]}"></div></div></div>`;
  }).join('');
}

function renderLargestExpenses(transactions) {
  const container = document.getElementById('largest-expenses-list');
  if (!container) return;
  
  const expenses = transactions.filter(t => t.type === 'expense').sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0)).slice(0, 5);
  
  if (expenses.length === 0) {
    container.innerHTML = '<p class="no-data">No data available</p>';
    return;
  }
  
  container.innerHTML = expenses.map((t, i) => {
    const date = parseDate(t.date);
    const dateStr = date ? date.toLocaleDateString() : '';
    const catName = getCategoryName(t.category, 'expense');
    return `<div class="top-item expense-item"><div class="top-item-info"><span class="top-item-rank">${i + 1}</span><span class="top-item-name">${catName}</span></div><div class="top-item-stats"><span class="top-item-amount expense">${formatCurrency(t.amount)}</span><span class="top-item-date">${dateStr}</span></div></div>`;
  }).join('');
}

function renderExpensesList(expenses) {
  const container = document.getElementById('expenses-list');
  if (!container) return;

  if (expenses.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No transactions yet.</p>';
    return;
  }

  const grouped = {};
  expenses.forEach(exp => {
    const date = parseDate(exp.date);
    if (!date) return;
    const dateKey = date.toISOString().split('T')[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(exp);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let html = "";

  sortedDates.forEach(dateKey => {
    let label = dateKey;
    if (dateKey === today) label = "Today";
    else if (dateKey === yesterday) label = "Yesterday";
    else {
      const d = new Date(dateKey);
      label = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    html += `
      <div class="date-group">
        <div class="date-header">${label}</div>
    `;

    grouped[dateKey].forEach(exp => {
      const icon = getCategoryIcon(exp.category, exp.type);
      const catName = getCategoryName(exp.category, exp.type);
      const amount = parseFloat(exp.convertedAmount) || parseFloat(exp.amount) || 0;
      const isExpense = exp.type === 'expense';
      const sign = isExpense ? '-' : '+';
      const colorClass = isExpense ? 'expense' : 'income';
      const recurringBadge = exp.isRecurring ? `<span class="recurring-badge">🔄 ${getRecurringLabel(exp.frequency)}</span>` : '';
      const accountName = window.accounts.find(a => a.id === exp.accountId)?.name || '';

      html += `
        <div class="transaction-item" data-id="${exp.id}">
          <div class="transaction-icon">${icon}</div>
          <div class="transaction-info">
            <div class="transaction-category">${catName}</div>
            ${recurringBadge}
            ${accountName ? `<div class="transaction-account">💰 ${accountName}</div>` : ''}
          </div>
          <div class="transaction-amount ${colorClass}">${sign} ${formatCurrency(amount)}</div>
          <div class="transaction-actions">
            <button class="btn-icon edit-transaction" title="Edit">✏️</button>
            <button class="btn-icon delete-transaction" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });
  
  container.innerHTML = html;

  container.querySelectorAll('.delete-transaction').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const item = e.target.closest('.transaction-item');
      const id = item?.dataset.id;
      if (!id) return;
      
      if (confirm('Delete this transaction?')) {
        try {
          await deleteExpense(id);
          showAlert('Transaction deleted!', 'success');
          await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
        } catch (err) {
          console.error(err);
          showAlert('Failed to delete transaction.', 'error');
        }
      }
    });
  });
}

function renderGoalsList(goals) {
  //console.log('GOALS:', goals.map(g => ({ title: g.title, isArchived: g.isArchived, currentAmount: g.currentAmount, targetAmount: g.targetAmount })));

  const today = new Date();

  goals = goals.map(g => {
    const isArchived = g.archived === true || g.archived === "true";
    const isCompleted = !isArchived && g.currentAmount >= g.targetAmount;

    const projection = calculateProjection(
      g.targetAmount,
      g.currentAmount,
      g.monthlyContribution,
      g.dueDate
    );

    return {
      ...g,
      isCompleted,
      isArchived,
      projection
    };
  });

  const archivedGoals = goals.filter(g => g.isArchived);
  const completedGoals = goals.filter(g => g.isCompleted && !g.isArchived);
  const activeGoals = goals.filter(g => !g.isCompleted && !g.isArchived);
  
  renderGoalsContainer('archived-goals-list', archivedGoals, 'archived');
  renderGoalsContainer('completed-goals-list', completedGoals, 'completed');
  renderGoalsContainer('active-goals-list', activeGoals, 'active');
}

function renderGoalsContainer(containerId, goals, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (goals.length === 0) {
    const messages = {
      'active': 'No active goals. Create one to start!',
      'completed': 'No completed goals yet.',
      'archived': 'No archived goals.'
    };
    container.innerHTML = `<p style="color: #999; text-align: center; padding: 40px;">${messages[type]}</p>`;
    return;
  }
  
  container.innerHTML = goals.map(goal => {
    const current = Number(goal.currentAmount) || 0;
    const target = Number(goal.targetAmount) || 1;
    const progress = Math.min((current / target) * 100, 100);
    
    const dueDate = parseDate(goal.dueDate);
    const dueDateStr = dueDate ? dueDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    
    const projection = calculateProjection(
      goal.targetAmount,
      goal.currentAmount,
      goal.monthlyContribution
    );

    const projectionHtml = projection && projection.expectedDate ? `<div class="goal-projection">🔮 ${formatExpectedDate(projection.expectedDate)} · ${formatProjectionTime(projection.years, projection.months, window.i18n.t)}</div>` : '';
    
    const priorityBadge = goal.isPriority ? '⭐ ' : '';
    
    return `
      <div class="goal-card" data-id="${goal.id}" style="border-left: 4px solid ${goal.isPriority ? '#f59e0b' : '#6c21e4'}">
        <div class="goal-header">
          <h4>${priorityBadge}${goal.title || 'Untitled Goal'}</h4>
          ${dueDateStr ? `<span class="goal-due">Due: ${dueDateStr}</span>` : ''}
        </div>
        ${projectionHtml}
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="goal-amounts">
          <span>${formatCurrency(current)} / ${formatCurrency(target)}</span>
          <span>${progress.toFixed(0)}%</span>
        </div>
        <div class="goal-actions">
          ${type === 'active' ? '<button class="btn-small edit-goal">Edit</button>' : ''}
          <button class="btn-small delete-goal">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.delete-goal').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = e.target.closest('.goal-card');
      const id = card?.dataset.id;
      if (!id) return;
      
      if (confirm('Delete this goal?')) {
        try {
          await deleteGoal(id);
          showAlert('Goal deleted!', 'success');
          await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
        } catch (err) {
          console.error(err);
          showAlert('Failed to delete goal.', 'error');
        }
      }
    });
  });
  
  container.querySelectorAll('.edit-goal').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = e.target.closest('.goal-card');
      const id = card?.dataset.id;
      const goal = allGoals.find(g => g.id === id);
      if (!goal) return;
      
      let dueDateValue = "";
      if (goal.dueDate) {
        if (typeof goal.dueDate === 'string') dueDateValue = goal.dueDate.split('T')[0];
        else if (goal.dueDate.toDate) dueDateValue = goal.dueDate.toDate().toISOString().split('T')[0];
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
            const titleEl = modalInstance.getField("#goal-title");
            const targetEl = modalInstance.getField("#goal-target");
            const dateEl = modalInstance.getField("#goal-date");
            const monthlyEl = modalInstance.getField("#goal-monthly");
            const priorityEl = modalInstance.getField("#goal-priority");

            if (!titleEl.value || !targetEl.value || !dateEl.value) {
              showAlert("Fill all fields.", "error");
              return false;
            }

            await updateGoal(goal.id, {
              title: titleEl.value.trim(),
              targetAmount: parseFloat(targetEl.value) || 0,
              dueDate: dateEl.value,
              monthlyContribution: parseFloat(monthlyEl.value) || 0,
              isPriority: priorityEl.checked
            });
            
            await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
            showAlert("Goal updated!", "success");
            return true;
          } catch (err) {
            console.error(err);
            showAlert("Failed to update goal.", "error");
            return false;
          }
        }
      });
    });
  });
}

function setupGoalTabs() {
  document.querySelectorAll('.goal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.goal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const target = tab.dataset.tab;
      document.querySelectorAll('.goals-tab-content').forEach(c => {
        c.classList.add('hidden');
      });

      document.getElementById(`${target}-goals-container`)?.classList.remove('hidden');
    });
  });
}

function setupActionButtons() {
  const addIncomeBtn = document.getElementById('add-income');
  const addExpenseBtn = document.getElementById('add-expense');
  const addGoalBtn = document.getElementById('add-goal');
  const contributeBtn = document.getElementById('contribute-goal');
  
  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', () => {
      showModal({
        title: "Add Income",
        type: "income",
        preselectedType: "income",
        onConfirm: async (modalInstance) => {
          try {
            if (!auth.currentUser) { showAlert("Please log in first.", "error"); return false; }

            const amountEl = modalInstance.getField("#exp-amount");
            const categoryEl = modalInstance.getField("#exp-category");
            const dateEl = modalInstance.getField("#exp-date");
            const currencyEl = modalInstance.getField("#exp-currency");
            const accountEl = modalInstance.getField("#exp-account");
            const recurringEl = modalInstance.getField("#exp-recurring");
            const notesEl = modalInstance.getField("#exp-notes");

            if (!amountEl.value || !categoryEl.value || !dateEl.value) { showAlert("Fill all fields.", "error"); return false; }
            
            const accountId = accountEl?.value || "";
            if (!accountId) { showAlert("Please select an account.", "error"); return false; }

            const validation = validateAmount(amountEl.value);
            if (!validation.valid) { showAlert(validation.error, "error"); return false; }
            
            const transactionData = {
              amount: validation.value,
              category: categoryEl.value.trim(),
              type: "income",
              date: dateEl.value,
              currency: currencyEl?.value || "EUR",
              accountId,
              isRecurring: recurringEl?.checked || false
            };
            
            if (notesEl?.value?.trim()) transactionData.notes = notesEl.value.trim();
            if (transactionData.isRecurring) {
              transactionData.frequency = modalInstance.getField("#exp-frequency").value;
              const endDate = modalInstance.getField("#exp-end-date")?.value;
              if (endDate) transactionData.endDate = endDate;
            }

            await addExpense(auth.currentUser.uid, transactionData);
            showAlert("Income added!", "success");
            await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
            return true;
          } catch (err) {
            console.error(err);
            showAlert("Failed to add income.", "error");
            return false;
          }
        }
      });
    });
  }
  
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      showModal({
        title: "Add Expense",
        type: "expense",
        preselectedType: "expense",
        onConfirm: async (modalInstance) => {
          try {
            if (!auth.currentUser) { showAlert("Please log in first.", "error"); return false; }

            const amountEl = modalInstance.getField("#exp-amount");
            const categoryEl = modalInstance.getField("#exp-category");
            const dateEl = modalInstance.getField("#exp-date");
            const currencyEl = modalInstance.getField("#exp-currency");
            const paymentMethodEl = modalInstance.getField("#exp-payment-method");
            const accountEl = modalInstance.getField("#exp-account");
            const recurringEl = modalInstance.getField("#exp-recurring");
            const notesEl = modalInstance.getField("#exp-notes");

            if (!amountEl.value || !categoryEl.value || !dateEl.value) { showAlert("Fill all fields.", "error"); return false; }
            
            const accountId = accountEl?.value || "";
            if (!accountId) { showAlert("Please select an account.", "error"); return false; }

            const validation = validateAmount(amountEl.value);
            if (!validation.valid) { showAlert(validation.error, "error"); return false; }
            
            const paymentMethod = paymentMethodEl?.value;
            if (!paymentMethod) { showAlert("Please select a payment method.", "error"); return false; }

            const transactionData = {
              amount: validation.value,
              category: categoryEl.value.trim(),
              type: "expense",
              date: dateEl.value,
              currency: currencyEl?.value || "EUR",
              paymentMethod,
              accountId,
              isRecurring: recurringEl?.checked || false
            };
            
            if (notesEl?.value?.trim()) transactionData.notes = notesEl.value.trim();
            if (transactionData.isRecurring) {
              transactionData.frequency = modalInstance.getField("#exp-frequency").value;
              const endDate = modalInstance.getField("#exp-end-date")?.value;
              if (endDate) transactionData.endDate = endDate;
            }

            await addExpense(auth.currentUser.uid, transactionData);
            showAlert("Expense added!", "success");
            await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
            return true;
          } catch (err) {
            console.error(err);
            showAlert("Failed to add expense.", "error");
            return false;
          }
        }
      });
    });
  }
  
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', () => {
      showModal({
        title: "Add Goal",
        type: "goal",
        onConfirm: async (modalInstance) => {
          try {
            if (!auth.currentUser) { showAlert("Please log in first.", "error"); return false; }

            const titleEl = modalInstance.getField("#goal-title");
            const targetEl = modalInstance.getField("#goal-target");
            const dateEl = modalInstance.getField("#goal-date");
            const monthlyEl = modalInstance.getField("#goal-monthly");
            const priorityEl = modalInstance.getField("#goal-priority");

            if (!titleEl.value || !targetEl.value || !dateEl.value) { showAlert("Fill all fields.", "error"); return false; }

            await addGoal(auth.currentUser.uid, titleEl.value.trim(), parseFloat(targetEl.value) || 0, dateEl.value, parseFloat(monthlyEl.value) || 0, priorityEl.checked);
            await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
            showAlert("Goal added!", "success");
            return true;
          } catch (err) {
            console.error(err);
            showAlert("Failed to add goal.", "error");
            return false;
          }
        }
      });
    });
  }
  
  if (contributeBtn) {
    contributeBtn.addEventListener('click', () => {
      if (!allGoals || allGoals.length === 0) {
        showAlert("No goals available. Create a goal first!", "error");
        return;
      }
      
      window.goals = allGoals;
      
      showModal({
        title: "Contribute to Goal",
        type: "contribute",
        onConfirm: async (modalInstance) => {
          try {
            if (!auth.currentUser) { showAlert("Please log in first.", "error"); return false; }

            const goalEl = modalInstance.getField("#contrib-goal");
            const amountEl = modalInstance.getField("#contrib-amount");
            const operationEl = modalInstance.getField("#contrib-operation");
            const noteEl = modalInstance.getField("#contrib-note");

            if (!goalEl.value || !amountEl.value) { showAlert("Fill all fields.", "error"); return false; }

            const rawAmount = parseFloat(amountEl.value) || 0;
            if (rawAmount <= 0) { showAlert("Amount must be greater than zero.", "error"); return false; }
            
            const amount = operationEl?.value === "withdraw" ? -rawAmount : rawAmount;
            const result = await addContribution(goalEl.value.trim(), amount, noteEl?.value?.trim() || '');
            
            await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
            showAlert(result.isWithdrawal ? "Withdrawal registered!" : "Contribution added!", "success");
            
            if (result.justCompleted) {
              const goal = allGoals.find(g => g.id === goalEl.value);
              if (goal) {
                setTimeout(() => showGoalCompletionModal(goal, async () => {
                  await refreshAnalytics(document.getElementById('analytics-period')?.value || 'current_year');
                }), 500);
              }
            }
            
            return true;
          } catch (err) {
            console.error(err);
            showAlert("Failed to add contribution.", "error");
            return false;
          }
        }
      });
    });
  }
}

async function refreshAnalytics(period) {
  if (!auth.currentUser) return;

  allGoals = normalizeGoalRecords(await loadGoals(auth.currentUser.uid));

  const filtered = filterTransactions(allTransactions, period);
  const expandedTransactions = expandRecurringTransactions(filtered, getPeriodBounds(period));
  
  const summary = calculateSummary(expandedTransactions);
  updateSummaryDisplay(summary);
  
  const monthlyData = getMonthlyData(expandedTransactions, period);
  renderMonthlyChart(monthlyData);
  
  const categoryData = getCategoryData(expandedTransactions);
  renderCategoryChart(categoryData);
  
  const trendData = getTrendData(expandedTransactions, period);
  renderTrendChart(trendData);
  
  renderTopCategories(expandedTransactions);
  renderLargestExpenses(expandedTransactions);
  renderExpensesList(expandedTransactions);
  renderGoalsList(allGoals);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  
  await loadUserPreferences(user.uid);
  allTransactions = await loadTransactions(user.uid);
  allGoals = normalizeGoalRecords(await loadGoals(user.uid));
  window.accounts = await loadAccounts(user.uid);
  window.goals = allGoals;
  
  setupGoalTabs();
  setupActionButtons();
  
  const periodSelect = document.getElementById('analytics-period');
  const initialPeriod = periodSelect?.value || 'current_year';
  
  await refreshAnalytics(initialPeriod);
  
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => refreshAnalytics(e.target.value));
  }
  
  if (window.location.hash === '#goals') {
    document.getElementById('goals')?.scrollIntoView({ behavior: 'smooth' });
  }
});

document.addEventListener('themeChanged', () => {
  const periodSelect = document.getElementById('analytics-period');
  if (periodSelect && allTransactions.length > 0) {
    refreshAnalytics(periodSelect.value);
  }
});
