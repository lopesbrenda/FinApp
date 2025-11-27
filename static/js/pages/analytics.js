import { auth, db } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { showAlert } from "../utils/alerts.js";
import { getCategoryName } from "../expenses.js";

const Chart = window.Chart;

let monthlyChart = null;
let categoryChart = null;
let trendChart = null;
let currencySymbol = '$';
let allTransactions = [];

function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'BRL': 'R$',
    'GBP': '£'
  };
  return symbols[currency] || '$';
}

const chartColors = [
  '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#14b8a6', '#eab308', '#a855f7', '#22c55e'
];

function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `${currencySymbol}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
    const q = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where("uid", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading transactions:", error);
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
    const amount = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  });
  
  return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
}

function updateSummaryDisplay(summary) {
  document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
  document.getElementById('total-expenses').textContent = formatCurrency(summary.totalExpenses);
  
  const balanceEl = document.getElementById('net-balance');
  balanceEl.textContent = formatCurrency(summary.netBalance);
  balanceEl.className = 'stat-value ' + (summary.netBalance >= 0 ? 'positive' : 'negative');
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
      const amount = parseFloat(t.amount) || 0;
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
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catName = getCategoryName(t.category, 'expense');
      if (!categories[catName]) {
        categories[catName] = 0;
      }
      categories[catName] += parseFloat(t.amount) || 0;
    });
  
  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return {
    labels: sorted.map(([name]) => name),
    data: sorted.map(([, amount]) => amount),
    total: sorted.reduce((sum, [, amount]) => sum + amount, 0)
  };
}

function getTrendData(transactions, period) {
  const bounds = getPeriodBounds(period);
  const dayData = {};
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const date = parseDate(t.date);
      if (!date) return;
      const key = date.toISOString().split('T')[0];
      if (!dayData[key]) {
        dayData[key] = 0;
      }
      dayData[key] += parseFloat(t.amount) || 0;
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
  
  if (monthlyChart) {
    monthlyChart.destroy();
  }
  
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Income',
          data: data.incomeData,
          backgroundColor: '#10b981',
          borderRadius: 6
        },
        {
          label: 'Expenses',
          data: data.expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: { 
            color: textColor,
            callback: (value) => formatCurrency(value)
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  
  if (categoryChart) {
    categoryChart.destroy();
  }
  
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e0e0e0' : '#333';
  
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
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              const percent = ((value / data.total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(value)} (${percent}%)`;
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
    return `
      <div class="legend-item">
        <span class="legend-color" style="background: ${chartColors[i]}"></span>
        <span class="legend-label">${label}</span>
        <span class="legend-value">${percent}%</span>
      </div>
    `;
  }).join('');
}

function renderTrendChart(data) {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;
  
  if (trendChart) {
    trendChart.destroy();
  }
  
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
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: { 
            color: textColor,
            maxTicksLimit: 10
          },
          grid: { display: false }
        },
        y: {
          ticks: { 
            color: textColor,
            callback: (value) => formatCurrency(value)
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function renderTopCategories(transactions) {
  const container = document.getElementById('top-categories-list');
  if (!container) return;
  
  const categoryData = getCategoryData(transactions);
  
  if (categoryData.labels.length === 0) {
    container.innerHTML = '<p class="no-data" data-i18n="analytics.no_data">No data available</p>';
    return;
  }
  
  container.innerHTML = categoryData.labels.slice(0, 5).map((label, i) => {
    const amount = categoryData.data[i];
    const percent = ((amount / categoryData.total) * 100).toFixed(1);
    return `
      <div class="top-item">
        <div class="top-item-info">
          <span class="top-item-rank">${i + 1}</span>
          <span class="top-item-name">${label}</span>
        </div>
        <div class="top-item-stats">
          <span class="top-item-amount">${formatCurrency(amount)}</span>
          <span class="top-item-percent">${percent}%</span>
        </div>
        <div class="top-item-bar">
          <div class="top-item-fill" style="width: ${percent}%; background: ${chartColors[i]}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderLargestExpenses(transactions) {
  const container = document.getElementById('largest-expenses-list');
  if (!container) return;
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
    .slice(0, 5);
  
  if (expenses.length === 0) {
    container.innerHTML = '<p class="no-data" data-i18n="analytics.no_data">No data available</p>';
    return;
  }
  
  container.innerHTML = expenses.map((t, i) => {
    const date = parseDate(t.date);
    const dateStr = date ? date.toLocaleDateString() : '';
    const catName = getCategoryName(t.category, 'expense');
    return `
      <div class="top-item expense-item">
        <div class="top-item-info">
          <span class="top-item-rank">${i + 1}</span>
          <span class="top-item-name">${catName}</span>
        </div>
        <div class="top-item-stats">
          <span class="top-item-amount expense">${formatCurrency(t.amount)}</span>
          <span class="top-item-date">${dateStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function refreshAnalytics(period) {
  const filtered = filterTransactions(allTransactions, period);
  const summary = calculateSummary(filtered);
  updateSummaryDisplay(summary);
  
  const monthlyData = getMonthlyData(filtered, period);
  renderMonthlyChart(monthlyData);
  
  const categoryData = getCategoryData(filtered);
  renderCategoryChart(categoryData);
  
  const trendData = getTrendData(filtered, period);
  renderTrendChart(trendData);
  
  renderTopCategories(filtered);
  renderLargestExpenses(filtered);
}

onAuthStateChanged(auth, async (user) => {
  if (user && user.emailVerified) {
    await loadUserPreferences(user.uid);
    allTransactions = await loadTransactions(user.uid);
    
    const periodSelect = document.getElementById('analytics-period');
    const initialPeriod = periodSelect?.value || 'current_year';
    
    await refreshAnalytics(initialPeriod);
    
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        refreshAnalytics(e.target.value);
      });
    }
  }
});

document.addEventListener('themeChanged', () => {
  const periodSelect = document.getElementById('analytics-period');
  if (periodSelect && allTransactions.length > 0) {
    refreshAnalytics(periodSelect.value);
  }
});
