// Goal due date notification system

import { showAlert } from "./alerts.js";

export function checkGoalNotifications(goals, userPreferences) {
  if (!goals || goals.length === 0) {
    return;
  }

  if (!userPreferences || !userPreferences.preferences || !userPreferences.preferences.alertGoals) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifications = [];

  goals.forEach(goal => {
    if (!goal.dueDate) return;

    let dueDate;
    if (typeof goal.dueDate === 'string') {
      dueDate = new Date(goal.dueDate);
    } else if (goal.dueDate.toDate) {
      dueDate = goal.dueDate.toDate();
    } else {
      return;
    }

    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      notifications.push({
        goal,
        days: diffDays,
        type: "overdue",
        priority: 1
      });
    } else if (diffDays === 0) {
      notifications.push({
        goal,
        days: 0,
        type: "today",
        priority: 2
      });
    } else if (diffDays === 1) {
      notifications.push({
        goal,
        days: 1,
        type: "tomorrow",
        priority: 3
      });
    } else if (diffDays === 2) {
      notifications.push({
        goal,
        days: 2,
        type: "soon",
        priority: 4
      });
    } else if (diffDays === 3) {
      notifications.push({
        goal,
        days: 3,
        type: "soon",
        priority: 5
      });
    }
  });

  if (notifications.length === 0) {
    return;
  }

  notifications.sort((a, b) => a.priority - b.priority);

  showGoalNotificationModal(notifications);
}

function showGoalNotificationModal(notifications) {
  const existingModal = document.getElementById("goal-notification-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "goal-notification-modal";
  modal.className = "modal-overlay";

  const notificationItems = notifications.map(notif => {
    let message = "";
    let icon = "";
    let color = "";

    if (notif.type === "overdue") {
      const daysOverdue = Math.abs(notif.days);
      icon = "⏰";
      color = "#e74c3c";
      message = `<strong>${notif.goal.title}</strong> is <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue!</strong>`;
    } else if (notif.type === "today") {
      icon = "🎯";
      color = "#f39c12";
      message = `<strong>${notif.goal.title}</strong> is <strong>due TODAY!</strong>`;
    } else if (notif.type === "tomorrow") {
      icon = "📅";
      color = "#f39c12";
      message = `<strong>${notif.goal.title}</strong> is due <strong>tomorrow</strong>`;
    } else if (notif.type === "soon") {
      icon = "⏳";
      color = "#3498db";
      message = `<strong>${notif.goal.title}</strong> is due in <strong>${notif.days} days</strong>`;
    }

    const currentAmount = notif.goal.currentAmount || 0;
    const targetAmount = notif.goal.targetAmount || 0;
    const progress = targetAmount > 0 ? ((currentAmount / targetAmount) * 100).toFixed(0) : 0;

    return `
      <div style="
        padding: 16px;
        margin-bottom: 12px;
        border-left: 4px solid ${color};
        background: rgba(${hexToRgb(color)}, 0.1);
        border-radius: 4px;
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <span style="font-size: 24px;">${icon}</span>
          <div style="flex: 1;">
            <p style="margin: 0 0 8px 0; color: ${color};">${message}</p>
            <div style="margin-top: 8px;">
              <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: ${color}; height: 100%; width: ${progress}%;"></div>
              </div>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #666;">Progress: ${progress}%</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <h2 style="margin-bottom: 20px; color: #333;">🔔 Goal Reminders</h2>
      <div style="max-height: 400px; overflow-y: auto;">
        ${notificationItems}
      </div>
      <div class="modal-actions" style="margin-top: 24px;">
        <button id="notification-close" class="btn" style="width: 100%;">Got it!</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add("show"), 10);

  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 300);
  };

  document.getElementById("notification-close").addEventListener("click", closeModal);

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
