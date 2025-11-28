// Expense notification system

import { showAlert } from "./alerts.js";

export function checkExpenseNotifications(expenses, userPreferences) {
  if (!expenses || expenses.length === 0) {
    return;
  }

  if (!userPreferences || !userPreferences.preferences || !userPreferences.preferences.alertExpenses) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const realExpenses = expenses.filter(e => {
    if (e.virtualOccurrence) {
      return false;
    }
    const transactionDate = e.date || e.createdAt;
    const date = transactionDate?.toDate ? transactionDate.toDate() : new Date(transactionDate || Date.now());
    return date <= today;
  });

  const totalIncome = realExpenses
    .filter(e => e.type === "income")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalExpenses = realExpenses
    .filter(e => e.type === "expense")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const notifications = [];

  if (totalIncome > 0) {
    const spendingRatio = (totalExpenses / totalIncome) * 100;

    if (spendingRatio >= 100) {
      notifications.push({
        type: "overspending",
        priority: 1,
        icon: "🚨",
        color: "#e74c3c",
        message: `You've spent <strong>more than your income!</strong>`,
        details: `Expenses: ${totalExpenses.toFixed(2)} | Income: ${totalIncome.toFixed(2)} (${spendingRatio.toFixed(0)}%)`
      });
    } else if (spendingRatio >= 90) {
      notifications.push({
        type: "high-spending",
        priority: 2,
        icon: "⚠️",
        color: "#f39c12",
        message: `You've spent <strong>${spendingRatio.toFixed(0)}%</strong> of your income`,
        details: `Expenses: ${totalExpenses.toFixed(2)} | Income: ${totalIncome.toFixed(2)}`
      });
    } else if (spendingRatio >= 80) {
      notifications.push({
        type: "warning-spending",
        priority: 3,
        icon: "💰",
        color: "#3498db",
        message: `You've spent <strong>${spendingRatio.toFixed(0)}%</strong> of your income`,
        details: `Expenses: ${totalExpenses.toFixed(2)} | Income: ${totalIncome.toFixed(2)}`
      });
    }
  }

  const recurringExpenses = expenses.filter(e => 
    e.isRecurring && 
    e.type === "expense" && 
    !e.virtualOccurrence &&
    e.date
  );

  recurringExpenses.forEach(exp => {
    let nextDate;
    
    if (typeof exp.date === 'string') {
      nextDate = new Date(exp.date);
    } else if (exp.date.toDate) {
      nextDate = exp.date.toDate();
    } else {
      return;
    }

    nextDate.setHours(0, 0, 0, 0);

    const frequency = exp.frequency || 'monthly';
    
    while (nextDate < today) {
      if (frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else {
        break;
      }
    }

    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      let icon = "📅";
      let color = "#3498db";
      let message = "";

      if (diffDays === 0) {
        icon = "💸";
        color = "#f39c12";
        message = `Recurring expense <strong>${exp.category}</strong> is <strong>due TODAY!</strong>`;
      } else if (diffDays === 1) {
        icon = "📅";
        color = "#f39c12";
        message = `Recurring expense <strong>${exp.category}</strong> is due <strong>tomorrow</strong>`;
      } else {
        icon = "⏳";
        color = "#3498db";
        message = `Recurring expense <strong>${exp.category}</strong> is due in <strong>${diffDays} days</strong>`;
      }

      notifications.push({
        type: "recurring-due",
        priority: 4,
        icon,
        color,
        message,
        details: `Amount: ${exp.amount.toFixed(2)} | Next: ${nextDate.toLocaleDateString()}`
      });
    }
  });

  if (notifications.length === 0) {
    return;
  }

  notifications.sort((a, b) => a.priority - b.priority);

  showExpenseNotificationModal(notifications);
}

function showExpenseNotificationModal(notifications) {
  const existingModal = document.getElementById("expense-notification-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "expense-notification-modal";
  modal.className = "modal-overlay";

  const notificationItems = notifications.map(notif => {
    return `
      <div style="
        padding: 16px;
        margin-bottom: 12px;
        border-left: 4px solid ${notif.color};
        background: rgba(${hexToRgb(notif.color)}, 0.1);
        border-radius: 4px;
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <span style="font-size: 24px;">${notif.icon}</span>
          <div style="flex: 1;">
            <p style="margin: 0 0 8px 0; color: ${notif.color};">${notif.message}</p>
            <p style="margin: 0; font-size: 0.85rem; color: #666;">${notif.details}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <h2 style="margin-bottom: 20px; color: #333;">💳 Expense Alerts</h2>
      <div style="max-height: 400px; overflow-y: auto;">
        ${notificationItems}
      </div>
      <div class="modal-actions" style="margin-top: 24px;">
        <button id="expense-notification-close" class="btn" style="width: 100%;">Got it!</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add("show"), 10);

  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  };

  document.getElementById("expense-notification-close").addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}
