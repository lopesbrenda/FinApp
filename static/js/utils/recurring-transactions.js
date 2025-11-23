/**
 * Recurring Transactions Utility
 * 
 * Handles dynamic generation of recurring transaction occurrences based on definition.
 */

/**
 * Calculate next occurrence date based on frequency
 * @param {Date} startDate - Starting date
 * @param {string} frequency - daily, weekly, monthly, yearly
 * @param {number} count - Number of intervals to add
 * @returns {Date} Next occurrence date
 */
function calculateNextDate(startDate, frequency, count = 1) {
  const date = new Date(startDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + count);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (count * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + count);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + count);
      break;
  }
  
  return date;
}

/**
 * Generate virtual occurrences of a recurring transaction for display
 * @param {Object} recurringTransaction - Recurring transaction definition
 * @param {number} maxOccurrences - Maximum future occurrences to generate
 * @returns {Array} Array of virtual transaction instances
 */
export function generateVirtualOccurrences(recurringTransaction, maxOccurrences = 12, maxPastCycles = 2) {
  if (!recurringTransaction.isRecurring || !recurringTransaction.frequency) {
    return [];
  }
  
  const transactionDate = recurringTransaction.date || recurringTransaction.transactionDate;
  if (!transactionDate) {
    console.warn("Recurring transaction missing date field:", recurringTransaction);
    return [];
  }
  
  const instances = [];
  const startDate = new Date(transactionDate);
  const endDate = recurringTransaction.endDate ? new Date(recurringTransaction.endDate) : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentCycleIndex = 0;
  for (let i = 0; i <= 1000; i++) {
    const cycleDate = calculateNextDate(startDate, recurringTransaction.frequency, i);
    if (cycleDate >= today) {
      currentCycleIndex = i;
      break;
    }
  }
  
  const startIndex = Math.max(1, currentCycleIndex - maxPastCycles);
  const endIndex = currentCycleIndex + maxOccurrences;
  
  for (let i = startIndex; i <= endIndex; i++) {
    const nextDate = calculateNextDate(startDate, recurringTransaction.frequency, i);
    
    if (endDate && nextDate > endDate) {
      break;
    }
    
    instances.push({
      ...recurringTransaction,
      date: nextDate.toISOString().split('T')[0],
      virtualOccurrence: true,
      occurrenceNumber: i,
      parentId: recurringTransaction.id,
      isPast: nextDate < today
    });
  }
  
  return instances;
}

/**
 * Expand all recurring transactions into virtual occurrences
 * @param {Array} transactions - All transactions (recurring and non-recurring)
 * @returns {Array} Transactions + virtual occurrences
 */
export function expandRecurringTransactions(transactions) {
  const expanded = [];
  
  transactions.forEach(txn => {
    const normalizedTxn = {
      ...txn,
      date: txn.date || txn.transactionDate || new Date().toISOString().split('T')[0]
    };
    
    expanded.push(normalizedTxn);
    
    if (normalizedTxn.isRecurring) {
      const occurrences = generateVirtualOccurrences(normalizedTxn, 12);
      expanded.push(...occurrences);
    }
  });
  
  return expanded.sort((a, b) => {
    const dateA = new Date(a.date || a.transactionDate || a.createdAt?.toDate?.() || new Date());
    const dateB = new Date(b.date || b.transactionDate || b.createdAt?.toDate?.() || new Date());
    return dateB - dateA;
  });
}

/**
 * Format recurring transaction display
 * @param {Object} transaction - Transaction object
 * @returns {string} Display string
 */
export function getRecurringLabel(transaction) {
  if (!transaction.isRecurring) return '';
  
  const frequencyLabels = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'yearly': 'Yearly'
  };
  
  const label = frequencyLabels[transaction.frequency] || 'Recurring';
  
  if (transaction.virtualOccurrence) {
    return `🔄 ${label} #${transaction.occurrenceNumber}`;
  }
  
  return `🔄 ${label}`;
}
