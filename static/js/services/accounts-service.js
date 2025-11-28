import { db } from "../firebase/firebase-config.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";
import { logActivity } from "./activity-log.js";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export const ACCOUNT_TYPES = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  CASH: 'cash',
  INVESTMENT: 'investment'
};

export const ACCOUNT_TYPE_LABELS = {
  checking: { en: 'Checking Account', pt: 'Conta Corrente' },
  savings: { en: 'Savings Account', pt: 'Poupança' },
  credit_card: { en: 'Credit Card', pt: 'Cartão de Crédito' },
  debit_card: { en: 'Debit Card', pt: 'Cartão de Débito' },
  cash: { en: 'Cash', pt: 'Dinheiro' },
  investment: { en: 'Investment', pt: 'Investimento' }
};

export const ACCOUNT_ICONS = {
  checking: '🏦',
  savings: '💰',
  credit_card: '💳',
  debit_card: '💳',
  cash: '💵',
  investment: '📈'
};

export const VALIDATION_RULES = {
  ALLOW_NEGATIVE_BALANCE: false,
  ALLOW_FUTURE_TRANSACTIONS: true,
  REQUIRE_ACCOUNT_FOR_TRANSACTION: true,
  TRANSFER_REQUIRES_DIFFERENT_ACCOUNTS: true
};

export function validateAccountData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Account name is required' });
  }
  
  if (!data.type || !Object.values(ACCOUNT_TYPES).includes(data.type)) {
    errors.push({ field: 'type', message: 'Valid account type is required' });
  }
  
  if (!data.currency || !['EUR', 'USD', 'BRL', 'GBP'].includes(data.currency)) {
    errors.push({ field: 'currency', message: 'Valid currency is required' });
  }
  
  if (data.initialBalance !== undefined && data.initialBalance !== null) {
    const balance = Number(data.initialBalance);
    if (isNaN(balance)) {
      errors.push({ field: 'initialBalance', message: 'Initial balance must be a number' });
    }
  }
  
  if (data.type === ACCOUNT_TYPES.CREDIT_CARD) {
    if (data.creditLimit !== undefined && data.creditLimit !== null) {
      const limit = Number(data.creditLimit);
      if (isNaN(limit) || limit < 0) {
        errors.push({ field: 'creditLimit', message: 'Credit limit must be a positive number' });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateTransactionForAccount(transaction, account, allAccounts = []) {
  const errors = [];
  
  if (VALIDATION_RULES.REQUIRE_ACCOUNT_FOR_TRANSACTION && !transaction.accountId) {
    errors.push({ field: 'accountId', message: 'Transaction must be linked to an account' });
  }
  
  if (!VALIDATION_RULES.ALLOW_FUTURE_TRANSACTIONS) {
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (transactionDate > today) {
      errors.push({ field: 'date', message: 'Future transactions are not allowed' });
    }
  }
  
  if (transaction.type === 'transfer') {
    if (!transaction.fromAccountId || !transaction.toAccountId) {
      errors.push({ field: 'accounts', message: 'Transfer requires source and destination accounts' });
    }
    
    if (VALIDATION_RULES.TRANSFER_REQUIRES_DIFFERENT_ACCOUNTS) {
      if (transaction.fromAccountId === transaction.toAccountId) {
        errors.push({ field: 'accounts', message: 'Cannot transfer to the same account' });
      }
    }
  }
  
  if (!VALIDATION_RULES.ALLOW_NEGATIVE_BALANCE && account) {
    if (transaction.type === 'expense' || transaction.type === 'transfer') {
      const amount = Number(transaction.amount);
      const currentBalance = Number(account.currentBalance || account.initialBalance || 0);
      
      if (account.type !== ACCOUNT_TYPES.CREDIT_CARD && currentBalance - amount < 0) {
        errors.push({ 
          field: 'amount', 
          message: `Insufficient balance. Available: ${currentBalance.toFixed(2)}` 
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function createAccount(userId, accountData) {
  const validation = validateAccountData(accountData);
  if (!validation.valid) {
    throw new Error(validation.errors.map(e => e.message).join(', '));
  }
  
  const data = {
    uid: userId,
    name: accountData.name.trim(),
    type: accountData.type,
    currency: accountData.currency,
    initialBalance: Number(accountData.initialBalance) || 0,
    currentBalance: Number(accountData.initialBalance) || 0,
    color: accountData.color || '#3b82f6',
    icon: accountData.icon || ACCOUNT_ICONS[accountData.type] || '🏦',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  if (accountData.bank) {
    data.bank = accountData.bank.trim();
  }
  
  if (accountData.lastFourDigits) {
    data.lastFourDigits = accountData.lastFourDigits.replace(/\D/g, '').slice(-4);
  }
  
  if (accountData.type === ACCOUNT_TYPES.CREDIT_CARD) {
    data.creditLimit = Number(accountData.creditLimit) || 0;
    data.statementClosingDay = Number(accountData.statementClosingDay) || 1;
    data.paymentDueDay = Number(accountData.paymentDueDay) || 10;
  }
  
  if (accountData.notes) {
    data.notes = accountData.notes.trim();
  }
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION.ACCOUNTS), data);
    
    await logActivity('created_account', 'accounts', docRef.id, null, {
      id: docRef.id,
      name: data.name,
      type: data.type,
      initialBalance: data.initialBalance
    });
    
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

export async function updateAccount(accountId, updates) {
  try {
    const accountRef = doc(db, COLLECTION.ACCOUNTS, accountId);
    const snap = await getDoc(accountRef);
    
    if (!snap.exists()) {
      throw new Error('Account not found');
    }
    
    const beforeData = { id: accountId, ...snap.data() };
    
    const allowedFields = [
      'name', 'bank', 'color', 'icon', 'notes', 'isActive',
      'creditLimit', 'statementClosingDay', 'paymentDueDay', 'lastFourDigits'
    ];
    
    const updateData = { updatedAt: serverTimestamp() };
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }
    
    await updateDoc(accountRef, updateData);
    
    await logActivity('updated_account', 'accounts', accountId, beforeData, {
      id: accountId,
      ...updateData
    });
    
    return true;
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
}

export async function deleteAccount(accountId) {
  try {
    const accountRef = doc(db, COLLECTION.ACCOUNTS, accountId);
    const snap = await getDoc(accountRef);
    
    if (!snap.exists()) {
      throw new Error('Account not found');
    }
    
    const accountData = { id: accountId, ...snap.data() };
    
    const transactionsQuery = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('accountId', '==', accountId)
    );
    const transactionsSnap = await getDocs(transactionsQuery);
    
    if (!transactionsSnap.empty) {
      throw new Error(`Cannot delete account with ${transactionsSnap.size} linked transactions. Archive it instead.`);
    }
    
    await deleteDoc(accountRef);
    
    await logActivity('deleted_account', 'accounts', accountId, accountData, null);
    
    return true;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}

export async function archiveAccount(accountId) {
  return updateAccount(accountId, { isActive: false });
}

export async function unarchiveAccount(accountId) {
  return updateAccount(accountId, { isActive: true });
}

export async function getUserAccounts(userId, includeArchived = false) {
  try {
    let q;
    if (includeArchived) {
      q = query(
        collection(db, COLLECTION.ACCOUNTS),
        where('uid', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION.ACCOUNTS),
        where('uid', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting accounts:", error);
    throw error;
  }
}

export async function getAccountById(accountId) {
  try {
    const accountRef = doc(db, COLLECTION.ACCOUNTS, accountId);
    const snap = await getDoc(accountRef);
    
    if (!snap.exists()) {
      return null;
    }
    
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Error getting account:", error);
    throw error;
  }
}

export function subscribeToAccounts(userId, callback, includeArchived = false) {
  let q;
  if (includeArchived) {
    q = query(
      collection(db, COLLECTION.ACCOUNTS),
      where('uid', '==', userId),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      collection(db, COLLECTION.ACCOUNTS),
      where('uid', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(accounts);
  }, (error) => {
    console.error("Error in accounts subscription:", error);
  });
}

export async function calculateAccountBalance(accountId, userId) {
  try {
    const account = await getAccountById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    
    const transactionsQuery = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('uid', '==', userId),
      where('accountId', '==', accountId)
    );
    
    const snapshot = await getDocs(transactionsQuery);
    
    let balance = Number(account.initialBalance) || 0;
    
    snapshot.docs.forEach(doc => {
      const tx = doc.data();
      const amount = Number(tx.amount) || 0;
      
      if (tx.type === 'income') {
        balance += amount;
      } else if (tx.type === 'expense') {
        balance -= amount;
      }
    });
    
    const transfersInQuery = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('uid', '==', userId),
      where('type', '==', 'transfer'),
      where('toAccountId', '==', accountId)
    );
    
    const transfersOutQuery = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('uid', '==', userId),
      where('type', '==', 'transfer'),
      where('fromAccountId', '==', accountId)
    );
    
    const [transfersInSnap, transfersOutSnap] = await Promise.all([
      getDocs(transfersInQuery),
      getDocs(transfersOutQuery)
    ]);
    
    transfersInSnap.docs.forEach(doc => {
      balance += Number(doc.data().amount) || 0;
    });
    
    transfersOutSnap.docs.forEach(doc => {
      balance -= Number(doc.data().amount) || 0;
    });
    
    return balance;
  } catch (error) {
    console.error("Error calculating balance:", error);
    throw error;
  }
}

export async function recalculateAllBalances(userId) {
  try {
    const accounts = await getUserAccounts(userId, true);
    const results = [];
    
    for (const account of accounts) {
      const newBalance = await calculateAccountBalance(account.id, userId);
      
      if (newBalance !== account.currentBalance) {
        await updateDoc(doc(db, COLLECTION.ACCOUNTS, account.id), {
          currentBalance: newBalance,
          updatedAt: serverTimestamp()
        });
      }
      
      results.push({
        accountId: account.id,
        name: account.name,
        previousBalance: account.currentBalance,
        newBalance
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error recalculating balances:", error);
    throw error;
  }
}

export async function updateAccountBalance(accountId, amount, operation) {
  try {
    const accountRef = doc(db, COLLECTION.ACCOUNTS, accountId);
    const snap = await getDoc(accountRef);
    
    if (!snap.exists()) {
      throw new Error('Account not found');
    }
    
    const currentBalance = Number(snap.data().currentBalance) || 0;
    let newBalance;
    
    switch (operation) {
      case 'add':
        newBalance = currentBalance + Number(amount);
        break;
      case 'subtract':
        newBalance = currentBalance - Number(amount);
        break;
      case 'set':
        newBalance = Number(amount);
        break;
      default:
        throw new Error('Invalid operation');
    }
    
    await updateDoc(accountRef, {
      currentBalance: newBalance,
      updatedAt: serverTimestamp()
    });
    
    return newBalance;
  } catch (error) {
    console.error("Error updating account balance:", error);
    throw error;
  }
}

export async function createTransfer(userId, fromAccountId, toAccountId, amount, date, notes = '') {
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }
  
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Transfer amount must be positive');
  }
  
  const [fromAccount, toAccount] = await Promise.all([
    getAccountById(fromAccountId),
    getAccountById(toAccountId)
  ]);
  
  if (!fromAccount || !toAccount) {
    throw new Error('One or both accounts not found');
  }
  
  if (!VALIDATION_RULES.ALLOW_NEGATIVE_BALANCE && fromAccount.type !== ACCOUNT_TYPES.CREDIT_CARD) {
    if (fromAccount.currentBalance < numAmount) {
      throw new Error(`Insufficient balance in ${fromAccount.name}`);
    }
  }
  
  try {
    const transferData = {
      uid: userId,
      type: 'transfer',
      amount: numAmount,
      fromAccountId,
      toAccountId,
      fromAccountName: fromAccount.name,
      toAccountName: toAccount.name,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION.TRANSACTIONS), transferData);
    
    await Promise.all([
      updateAccountBalance(fromAccountId, numAmount, 'subtract'),
      updateAccountBalance(toAccountId, numAmount, 'add')
    ]);
    
    await logActivity('created_transfer', 'transactions', docRef.id, null, {
      id: docRef.id,
      from: fromAccount.name,
      to: toAccount.name,
      amount: numAmount
    });
    
    return { id: docRef.id, ...transferData };
  } catch (error) {
    console.error("Error creating transfer:", error);
    throw error;
  }
}

export function getTotalBalance(accounts) {
  return accounts.reduce((total, account) => {
    if (account.type === ACCOUNT_TYPES.CREDIT_CARD) {
      return total - (Number(account.currentBalance) || 0);
    }
    return total + (Number(account.currentBalance) || 0);
  }, 0);
}

export function getAccountsByType(accounts, type) {
  return accounts.filter(a => a.type === type);
}

export function formatAccountDisplay(account, lang = 'en') {
  const typeLabel = ACCOUNT_TYPE_LABELS[account.type]?.[lang] || account.type;
  const icon = account.icon || ACCOUNT_ICONS[account.type] || '🏦';
  
  let display = `${icon} ${account.name}`;
  if (account.bank) {
    display += ` (${account.bank})`;
  }
  if (account.lastFourDigits) {
    display += ` ****${account.lastFourDigits}`;
  }
  
  return display;
}
