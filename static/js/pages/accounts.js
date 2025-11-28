import { auth } from "../firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { showAlert } from "../utils/alerts.js";
import { showModal } from "../utils/modal.js";
import { i18n } from "../i18n.js";
import { 
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_ICONS,
  createAccount,
  updateAccount,
  deleteAccount,
  archiveAccount,
  unarchiveAccount,
  getUserAccounts,
  subscribeToAccounts,
  recalculateAllBalances,
  createTransfer,
  getTotalBalance,
  formatAccountDisplay
} from "../services/accounts-service.js";

let currentUser = null;
let accounts = [];
let currentTab = 'all';
let unsubscribe = null;

function getCurrencySymbol(currency) {
  const symbols = { 'USD': '$', 'EUR': '€', 'BRL': 'R$', 'GBP': '£' };
  return symbols[currency] || '$';
}

function formatCurrency(amount, currency = 'EUR') {
  const symbol = getCurrencySymbol(currency);
  const formatted = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

function getLang() {
  return localStorage.getItem('language') || 'en';
}

function getAccountTypeLabel(type) {
  const lang = getLang();
  return ACCOUNT_TYPE_LABELS[type]?.[lang] || type;
}

function updateSummary() {
  const activeAccounts = accounts.filter(a => a.isActive !== false);
  
  const totalBalance = getTotalBalance(activeAccounts);
  document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
  
  const bankBalance = activeAccounts
    .filter(a => a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  document.getElementById('bank-balance').textContent = formatCurrency(bankBalance);
  
  const creditDebt = activeAccounts
    .filter(a => a.type === 'credit_card')
    .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  document.getElementById('credit-debt').textContent = formatCurrency(creditDebt);
  document.getElementById('credit-debt').style.color = creditDebt > 0 ? '#f44336' : '#4caf50';
  
  const cashBalance = activeAccounts
    .filter(a => a.type === 'cash')
    .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  document.getElementById('cash-balance').textContent = formatCurrency(cashBalance);
}

function renderAccounts() {
  const listEl = document.getElementById('accounts-list');
  const emptyEl = document.getElementById('empty-state');
  
  let filteredAccounts = accounts;
  
  if (currentTab === 'archived') {
    filteredAccounts = accounts.filter(a => a.isActive === false);
  } else if (currentTab !== 'all') {
    filteredAccounts = accounts.filter(a => a.type === currentTab && a.isActive !== false);
  } else {
    filteredAccounts = accounts.filter(a => a.isActive !== false);
  }
  
  if (filteredAccounts.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  
  emptyEl.style.display = 'none';
  
  const html = filteredAccounts.map(account => {
    const icon = account.icon || ACCOUNT_ICONS[account.type] || '🏦';
    const typeLabel = getAccountTypeLabel(account.type);
    const balance = Number(account.currentBalance) || 0;
    const isNegative = balance < 0;
    const isCreditCard = account.type === 'credit_card';
    
    let balanceClass = '';
    if (isCreditCard) {
      balanceClass = balance > 0 ? 'negative' : 'positive';
    } else {
      balanceClass = isNegative ? 'negative' : 'positive';
    }
    
    let creditInfo = '';
    if (isCreditCard && account.creditLimit) {
      const available = account.creditLimit - balance;
      creditInfo = `
        <div class="account-credit-info">
          <span class="credit-label">Limit: ${formatCurrency(account.creditLimit, account.currency)}</span>
          <span class="credit-available">Available: ${formatCurrency(available, account.currency)}</span>
        </div>
      `;
    }
    
    const archivedBadge = account.isActive === false ? '<span class="archived-badge">Archived</span>' : '';
    
    return `
      <div class="account-card ${account.isActive === false ? 'archived' : ''}" data-id="${account.id}" style="border-left: 4px solid ${account.color || '#3b82f6'}">
        <div class="account-header">
          <div class="account-icon">${icon}</div>
          <div class="account-info">
            <h3 class="account-name">${account.name} ${archivedBadge}</h3>
            <span class="account-type">${typeLabel}</span>
          </div>
          <div class="account-balance ${balanceClass}">
            ${formatCurrency(balance, account.currency)}
          </div>
        </div>
        ${creditInfo}
        <div class="account-actions">
          <button class="btn-small edit-btn" data-id="${account.id}">✏️ Edit</button>
          ${account.isActive !== false 
            ? `<button class="btn-small archive-btn" data-id="${account.id}">📦 Archive</button>`
            : `<button class="btn-small unarchive-btn" data-id="${account.id}">📤 Unarchive</button>`
          }
          <button class="btn-small delete-btn" data-id="${account.id}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  listEl.innerHTML = html;
  
  listEl.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  
  listEl.querySelectorAll('.archive-btn').forEach(btn => {
    btn.addEventListener('click', () => handleArchive(btn.dataset.id));
  });
  
  listEl.querySelectorAll('.unarchive-btn').forEach(btn => {
    btn.addEventListener('click', () => handleUnarchive(btn.dataset.id));
  });
  
  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id));
  });
}

function getAccountFormHTML(account = null) {
  const isEdit = !!account;
  const lang = getLang();
  
  const typeOptions = Object.entries(ACCOUNT_TYPES).map(([key, value]) => {
    const label = ACCOUNT_TYPE_LABELS[value]?.[lang] || value;
    const selected = account?.type === value ? 'selected' : '';
    return `<option value="${value}" ${selected}>${ACCOUNT_ICONS[value]} ${label}</option>`;
  }).join('');
  
  return `
    <div class="form-group">
      <label>Bank Name</label>
      <input type="text" id="account-name" value="${account?.name || ''}" placeholder="e.g., Chase, Santander, Nubank" required>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label data-i18n="accounts.type">Account Type</label>
        <select id="account-type" ${isEdit ? 'disabled' : ''}>
          ${typeOptions}
        </select>
      </div>
      
      <div class="form-group">
        <label data-i18n="accounts.currency">Currency</label>
        <select id="account-currency" ${isEdit ? 'disabled' : ''}>
          <option value="EUR" ${account?.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
          <option value="USD" ${account?.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
          <option value="BRL" ${account?.currency === 'BRL' ? 'selected' : ''}>BRL (R$)</option>
          <option value="GBP" ${account?.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label>${isEdit ? 'Current Balance' : 'Initial Balance'}</label>
      <input type="number" id="account-balance" value="${account?.currentBalance || account?.initialBalance || 0}" step="0.01" ${isEdit ? 'disabled' : ''}>
    </div>
    
    <div class="form-group credit-fields" style="display: none;">
      <label data-i18n="accounts.credit_limit">Credit Limit</label>
      <input type="number" id="account-limit" value="${account?.creditLimit || ''}" step="0.01" placeholder="5000">
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label data-i18n="accounts.color">Color</label>
        <input type="color" id="account-color" value="${account?.color || '#3b82f6'}">
      </div>
      
      <div class="form-group">
        <label data-i18n="accounts.icon">Icon</label>
        <select id="account-icon">
          <option value="🏦" ${account?.icon === '🏦' ? 'selected' : ''}>🏦 Bank</option>
          <option value="💳" ${account?.icon === '💳' ? 'selected' : ''}>💳 Card</option>
          <option value="💰" ${account?.icon === '💰' ? 'selected' : ''}>💰 Money</option>
          <option value="💵" ${account?.icon === '💵' ? 'selected' : ''}>💵 Cash</option>
          <option value="📈" ${account?.icon === '📈' ? 'selected' : ''}>📈 Investment</option>
          <option value="🐷" ${account?.icon === '🐷' ? 'selected' : ''}>🐷 Savings</option>
          <option value="💎" ${account?.icon === '💎' ? 'selected' : ''}>💎 Premium</option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label data-i18n="accounts.notes">Notes (optional)</label>
      <textarea id="account-notes" rows="2" placeholder="Any additional notes...">${account?.notes || ''}</textarea>
    </div>
  `;
}

function openAddModal() {
  showModal({
    title: 'Add Account',
    content: getAccountFormHTML(),
    confirmText: 'Save',
    onConfirm: async (modalInstance) => {
      const name = modalInstance.getField('#account-name')?.value?.trim();
      const type = modalInstance.getField('#account-type')?.value;
      const currency = modalInstance.getField('#account-currency')?.value;
      const initialBalance = modalInstance.getField('#account-balance')?.value;
      const creditLimit = modalInstance.getField('#account-limit')?.value;
      const color = modalInstance.getField('#account-color')?.value;
      const icon = modalInstance.getField('#account-icon')?.value;
      const notes = modalInstance.getField('#account-notes')?.value?.trim();
      
      if (!name) {
        showAlert('Bank name is required', 'error');
        return false;
      }
      
      try {
        await createAccount(currentUser.uid, {
          name,
          type,
          currency,
          initialBalance: Number(initialBalance) || 0,
          creditLimit: type === 'credit_card' ? Number(creditLimit) || 0 : undefined,
          color,
          icon,
          notes
        });
        
        showAlert('Account created successfully!', 'success');
        return true;
      } catch (error) {
        showAlert(error.message, 'error');
        return false;
      }
    },
    onOpen: (modalInstance) => {
      const typeSelect = modalInstance.getField('#account-type');
      const creditFields = modalInstance.getField('.credit-fields');
      
      typeSelect?.addEventListener('change', () => {
        if (creditFields) {
          creditFields.style.display = typeSelect.value === 'credit_card' ? 'block' : 'none';
        }
      });
    }
  });
}

function openEditModal(accountId) {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return;
  
  showModal({
    title: 'Edit Account',
    content: getAccountFormHTML(account),
    confirmText: 'Save',
    onConfirm: async (modalInstance) => {
      const name = modalInstance.getField('#account-name')?.value?.trim();
      const creditLimit = modalInstance.getField('#account-limit')?.value;
      const color = modalInstance.getField('#account-color')?.value;
      const icon = modalInstance.getField('#account-icon')?.value;
      const notes = modalInstance.getField('#account-notes')?.value?.trim();
      
      if (!name) {
        showAlert('Bank name is required', 'error');
        return false;
      }
      
      try {
        await updateAccount(accountId, {
          name,
          creditLimit: account.type === 'credit_card' ? Number(creditLimit) || 0 : undefined,
          color,
          icon,
          notes
        });
        
        showAlert('Account updated successfully!', 'success');
        return true;
      } catch (error) {
        showAlert(error.message, 'error');
        return false;
      }
    },
    onOpen: (modalInstance) => {
      const creditFields = modalInstance.getField('.credit-fields');
      if (creditFields && account.type === 'credit_card') {
        creditFields.style.display = 'block';
      }
    }
  });
}

async function handleArchive(accountId) {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return;
  
  showModal({
    title: 'Archive Account',
    content: `<p>Are you sure you want to archive <strong>${account.name}</strong>?</p><p>The account will be hidden but transactions will be preserved.</p>`,
    confirmText: 'Archive',
    onConfirm: async () => {
      try {
        await archiveAccount(accountId);
        showAlert('Account archived', 'success');
        return true;
      } catch (error) {
        showAlert(error.message, 'error');
        return false;
      }
    }
  });
}

async function handleUnarchive(accountId) {
  try {
    await unarchiveAccount(accountId);
    showAlert('Account restored', 'success');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function handleDelete(accountId) {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return;
  
  showModal({
    title: 'Delete Account',
    content: `<p>Are you sure you want to permanently delete <strong>${account.name}</strong>?</p><p style="color: #f44336;">This action cannot be undone.</p>`,
    confirmText: 'Delete',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        await deleteAccount(accountId);
        showAlert('Account deleted', 'success');
        return true;
      } catch (error) {
        showAlert(error.message, 'error');
        return false;
      }
    }
  });
}

function openTransferModal() {
  const activeAccounts = accounts.filter(a => a.isActive !== false);
  
  if (activeAccounts.length < 2) {
    showAlert('You need at least 2 accounts to make a transfer', 'warning');
    return;
  }
  
  const accountOptions = activeAccounts.map(a => {
    const icon = a.icon || ACCOUNT_ICONS[a.type] || '🏦';
    return `<option value="${a.id}">${icon} ${a.name}${a.bank ? ` (${a.bank})` : ''} - ${formatCurrency(a.currentBalance, a.currency)}</option>`;
  }).join('');
  
  const content = `
    <div class="form-group">
      <label data-i18n="accounts.from_account">From Account</label>
      <select id="transfer-from">${accountOptions}</select>
    </div>
    
    <div class="form-group">
      <label data-i18n="accounts.to_account">To Account</label>
      <select id="transfer-to">${accountOptions}</select>
    </div>
    
    <div class="form-group">
      <label data-i18n="accounts.amount">Amount</label>
      <input type="number" id="transfer-amount" step="0.01" min="0.01" placeholder="100.00" required>
    </div>
    
    <div class="form-group">
      <label data-i18n="accounts.date">Date</label>
      <input type="date" id="transfer-date" value="${new Date().toISOString().split('T')[0]}">
    </div>
    
    <div class="form-group">
      <label data-i18n="accounts.notes">Notes (optional)</label>
      <input type="text" id="transfer-notes" placeholder="Transfer description">
    </div>
  `;
  
  showModal({
    title: i18n.t('accounts.transfer') || 'Transfer Between Accounts',
    content,
    confirmText: i18n.t('accounts.transfer_btn') || 'Transfer',
    onConfirm: async (modalInstance) => {
      const fromId = modalInstance.getField('#transfer-from')?.value;
      const toId = modalInstance.getField('#transfer-to')?.value;
      const amount = modalInstance.getField('#transfer-amount')?.value;
      const date = modalInstance.getField('#transfer-date')?.value;
      const notes = modalInstance.getField('#transfer-notes')?.value?.trim();
      
      if (fromId === toId) {
        showAlert('Cannot transfer to the same account', 'error');
        return false;
      }
      
      if (!amount || Number(amount) <= 0) {
        showAlert('Enter a valid amount', 'error');
        return false;
      }
      
      try {
        await createTransfer(currentUser.uid, fromId, toId, amount, date, notes);
        showAlert('Transfer completed successfully!', 'success');
        return true;
      } catch (error) {
        showAlert(error.message, 'error');
        return false;
      }
    },
    onOpen: (modalInstance) => {
      if (activeAccounts.length >= 2) {
        const toSelect = modalInstance.getField('#transfer-to');
        if (toSelect) {
          toSelect.selectedIndex = 1;
        }
      }
    }
  });
}

async function handleRecalculate() {
  try {
    showAlert('Recalculating balances...', 'info');
    const results = await recalculateAllBalances(currentUser.uid);
    
    const changes = results.filter(r => r.previousBalance !== r.newBalance);
    if (changes.length > 0) {
      showAlert(`Updated ${changes.length} account(s)`, 'success');
    } else {
      showAlert('All balances are correct', 'success');
    }
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.accounts-tabs .tab-btn');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderAccounts();
    });
  });
}

function init() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      
      if (unsubscribe) {
        unsubscribe();
      }
      
      unsubscribe = subscribeToAccounts(user.uid, (accs) => {
        accounts = accs;
        updateSummary();
        renderAccounts();
      }, true);
      
    } else {
      window.location.href = '/login';
    }
  });
  
  setupTabs();
  
  document.getElementById('add-account-btn')?.addEventListener('click', openAddModal);
  document.getElementById('add-first-account-btn')?.addEventListener('click', openAddModal);
  document.getElementById('transfer-btn')?.addEventListener('click', openTransferModal);
  document.getElementById('recalculate-btn')?.addEventListener('click', handleRecalculate);
}

init();
