/**
 * Recurring Transactions Utility
 * 
 * Handles dynamic generation of recurring transaction occurrences based on definition.
 */

/**
 * Parse date string as local date (timezone-safe)
 * @param {string|Date|object} dateValue - Date value to parse
 * @returns {Date} Parsed local date
 */
function parseLocalDate(dateValue) {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (dateValue?.toDate) {
    return dateValue.toDate();
  }
  
  if (typeof dateValue === 'string') {
    const dateStr = dateValue.split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  
  return new Date(dateValue || Date.now());
}

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
 * @param {number} maxPastCycles - Maximum past cycles to include
 * @param {Date} boundStartDate - Optional: Only generate occurrences >= this date
 * @param {Date} boundEndDate - Optional: Only generate occurrences <= this date
 * @returns {Array} Array of virtual transaction instances
 */
export function generateVirtualOccurrences(recurringTransaction, maxOccurrences = 12, maxPastCycles = 2, boundStartDate = null, boundEndDate = null) {
  if (!recurringTransaction.isRecurring || !recurringTransaction.frequency) {
    return [];
  }
  
  const transactionDate = recurringTransaction.date || recurringTransaction.transactionDate;
  if (!transactionDate) {
    console.warn("Recurring transaction missing date field:", recurringTransaction);
    return [];
  }
  
  const instances = [];
  const startDate = parseLocalDate(transactionDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = recurringTransaction.endDate ? parseLocalDate(recurringTransaction.endDate) : null;
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
  }
  
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
    
    if (boundStartDate && nextDate < boundStartDate) {
      continue;
    }
    
    if (boundEndDate && nextDate > boundEndDate) {
      break;
    }
    
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    instances.push({
      ...recurringTransaction,
      date: formattedDate,
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
 * @param {Object} periodBounds - Optional: { startDate, endDate } to limit generated occurrences
 * @returns {Array} Transactions + virtual occurrences
 */
export function expandRecurringTransactions(transactions, periodBounds = null) {
  const expanded = [];
  
  const boundStartDate = periodBounds?.startDate || null;
  const boundEndDate = periodBounds?.endDate || null;
  
  transactions.forEach(txn => {
    const normalizedTxn = {
      ...txn,
      date: txn.date || txn.transactionDate || new Date().toISOString().split('T')[0]
    };
    
    const txnDate = parseLocalDate(normalizedTxn.date || normalizedTxn.createdAt);
    txnDate.setHours(0, 0, 0, 0);
    
    const withinBounds = !boundStartDate || !boundEndDate || 
      (txnDate >= boundStartDate && txnDate <= boundEndDate);
    
    if (withinBounds) {
      expanded.push(normalizedTxn);
    }
    
    if (normalizedTxn.isRecurring) {
      const occurrences = generateVirtualOccurrences(normalizedTxn, 12, 2, boundStartDate, boundEndDate);
      expanded.push(...occurrences);
    }
  });
  
  return expanded.sort((a, b) => {
    const dateA = parseLocalDate(a.date || a.transactionDate || a.createdAt);
    const dateB = parseLocalDate(b.date || b.transactionDate || b.createdAt);
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
