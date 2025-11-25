import { i18n } from '../i18n.js';
import { archiveGoal, restartGoal } from '../goals.js';
import { showAlert } from './alerts.js';

export function showGoalCompletionModal(goal, onComplete) {
  const existingModal = document.getElementById('goal-completion-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'goal-completion-modal';
  modal.className = 'modal-overlay';
  
  const createdDate = goal.createdAt ? new Date(goal.createdAt.seconds * 1000) : null;
  const completedDate = new Date();
  const daysToComplete = createdDate ? Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24)) : null;
  
  modal.innerHTML = `
    <div class="modal-content celebration-modal">
      <div class="celebration-header">
        <div class="celebration-icon">🎉</div>
        <h2 data-i18n="goal_completed_title">Goal Completed!</h2>
        <p class="celebration-subtitle" data-i18n="goal_completed_subtitle">Congratulations! You've reached your goal.</p>
      </div>
      
      <div class="goal-completion-summary">
        <div class="goal-completion-item">
          <span class="completion-label" data-i18n="goal_name">Goal:</span>
          <span class="completion-value">${goal.title}</span>
        </div>
        <div class="goal-completion-item">
          <span class="completion-label" data-i18n="target_amount">Target:</span>
          <span class="completion-value">${goal.targetAmount.toFixed(2)} ${window.userPreferences?.preferences?.currency || 'EUR'}</span>
        </div>
        ${daysToComplete ? `
          <div class="goal-completion-item">
            <span class="completion-label" data-i18n="time_to_complete">Time to complete:</span>
            <span class="completion-value">${daysToComplete} ${daysToComplete === 1 ? i18n.t('day') : i18n.t('days')}</span>
          </div>
        ` : ''}
      </div>

      <div class="celebration-message">
        <p data-i18n="what_would_you_like">What would you like to do?</p>
      </div>

      <div class="celebration-actions">
        <button class="btn-celebration btn-archive" data-goal-id="${goal.id}">
          <span class="btn-icon">📁</span>
          <span data-i18n="archive_goal">Archive Goal</span>
        </button>
        <button class="btn-celebration btn-restart" data-goal-id="${goal.id}">
          <span class="btn-icon">🔄</span>
          <span data-i18n="restart_goal">Restart Goal</span>
        </button>
        <button class="btn-celebration btn-keep" data-goal-id="${goal.id}">
          <span class="btn-icon">👀</span>
          <span data-i18n="keep_visible">Keep Visible</span>
        </button>
      </div>

      <button class="btn-close-celebration" data-i18n="close">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  const archiveBtn = modal.querySelector('.btn-archive');
  const restartBtn = modal.querySelector('.btn-restart');
  const keepBtn = modal.querySelector('.btn-keep');
  const closeBtn = modal.querySelector('.btn-close-celebration');

  archiveBtn.addEventListener('click', async () => {
    try {
      await archiveGoal(goal.id);
      showAlert(i18n.t('goal_archived_success'), 'success');
      modal.remove();
      if (onComplete) onComplete('archived');
    } catch (error) {
      console.error('Error archiving goal:', error);
      showAlert(i18n.t('goal_archived_error'), 'error');
    }
  });

  restartBtn.addEventListener('click', async () => {
    try {
      await restartGoal(goal.id);
      showAlert(i18n.t('goal_restarted_success'), 'success');
      modal.remove();
      if (onComplete) onComplete('restarted');
    } catch (error) {
      console.error('Error restarting goal:', error);
      showAlert(i18n.t('goal_restarted_error'), 'error');
    }
  });

  keepBtn.addEventListener('click', () => {
    modal.remove();
    if (onComplete) onComplete('kept');
  });

  closeBtn.addEventListener('click', () => {
    modal.remove();
    if (onComplete) onComplete('closed');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      if (onComplete) onComplete('dismissed');
    }
  });
}
