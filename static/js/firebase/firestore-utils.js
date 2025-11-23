/**
 * Firestore Utils - Helper functions
 * 
 * This file contains utility functions for Firestore operations.
 * Does NOT perform CRUD operations - only helper/formatting functions.
 * 
 * Examples: convert timestamps, format data, validate fields, map objects
 */

// ==================== CATEGORY DEFINITIONS ====================

export const EXPENSE_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: "🍔" },
  { id: "transport", name: "Transportation", icon: "🚗" },
  { id: "shopping", name: "Shopping", icon: "🛍️" },
  { id: "entertainment", name: "Entertainment", icon: "🎬" },
  { id: "bills", name: "Bills & Utilities", icon: "💡" },
  { id: "health", name: "Healthcare", icon: "🏥" },
  { id: "education", name: "Education", icon: "📚" },
  { id: "travel", name: "Travel", icon: "✈️" },
  { id: "other", name: "Other", icon: "📝" }
];

export const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary", icon: "💼" },
  { id: "freelance", name: "Freelance", icon: "💻" },
  { id: "investment", name: "Investment", icon: "📈" },
  { id: "business", name: "Business", icon: "🏢" },
  { id: "gift", name: "Gift", icon: "🎁" },
  { id: "bonus", name: "Bonus", icon: "💰" },
  { id: "refund", name: "Refund", icon: "↩️" },
  { id: "other", name: "Other Income", icon: "💵" }
];

// ==================== CATEGORY HELPERS ====================

/**
 * Get category icon by category ID
 * @param {string} categoryId - Category ID
 * @param {string} type - "income" or "expense"
 * @returns {string} Category icon emoji
 */
export function getCategoryIcon(categoryId, type) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const category = categories.find(c => c.id === categoryId);
  return category ? category.icon : "📝";
}

/**
 * Get category name by category ID
 * @param {string} categoryId - Category ID
 * @param {string} type - "income" or "expense"
 * @returns {string} Category name
 */
export function getCategoryName(categoryId, type) {
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const category = categories.find(c => c.id === categoryId);
  return category ? category.name : categoryId;
}

// ==================== DATE FORMATTING ====================

/**
 * Format Firestore timestamp to readable date
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
export function formatFirestoreDate(timestamp) {
  if (!timestamp) return "N/A";
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Format Firestore timestamp to ISO string
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} ISO date string
 */
export function firestoreToISO(timestamp) {
  if (!timestamp) return null;
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString();
  } catch (error) {
    console.error("Error converting to ISO:", error);
    return null;
  }
}

// ==================== NUMBER FORMATTING ====================

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, EUR, BRL, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = "USD") {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'BRL': 'R$',
    'GBP': '£'
  };
  
  const symbol = symbols[currency] || '$';
  const formatted = Number(amount).toFixed(2);
  
  return `${symbol}${formatted}`;
}

/**
 * Parse currency string to number
 * @param {string} value - Currency string
 * @returns {number} Parsed number
 */
export function parseCurrency(value) {
  if (typeof value === 'number') return value;
  
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

// ==================== VALIDATION ====================

/**
 * Validate transaction data
 * @param {number} amount - Transaction amount
 * @param {string} category - Category ID
 * @param {string} type - "income" or "expense"
 * @returns {Object} Validation result { valid: boolean, error: string }
 */
export function validateTransaction(amount, category, type) {
  if (!amount || amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }
  
  if (!category || category.trim() === "") {
    return { valid: false, error: "Category is required" };
  }
  
  if (type !== "income" && type !== "expense") {
    return { valid: false, error: "Type must be 'income' or 'expense'" };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate goal data
 * @param {string} title - Goal title
 * @param {number} targetAmount - Target amount
 * @param {string} dueDate - Due date
 * @returns {Object} Validation result { valid: boolean, error: string }
 */
export function validateGoal(title, targetAmount, dueDate) {
  if (!title || title.trim() === "") {
    return { valid: false, error: "Title is required" };
  }
  
  if (!targetAmount || targetAmount <= 0) {
    return { valid: false, error: "Target amount must be greater than 0" };
  }
  
  if (!dueDate) {
    return { valid: false, error: "Due date is required" };
  }
  
  const dueDateTime = new Date(dueDate).getTime();
  const now = Date.now();
  
  if (dueDateTime < now) {
    return { valid: false, error: "Due date must be in the future" };
  }
  
  return { valid: true, error: null };
}

// ==================== CALCULATIONS ====================

/**
 * Calculate total from transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {string} type - Filter by "income", "expense", or null for all
 * @returns {number} Total amount
 */
export function calculateTotal(transactions, type = null) {
  if (!Array.isArray(transactions)) return 0;
  
  return transactions
    .filter(t => !type || t.type === type)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

/**
 * Calculate balance (income - expenses)
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} Balance
 */
export function calculateBalance(transactions) {
  const income = calculateTotal(transactions, "income");
  const expenses = calculateTotal(transactions, "expense");
  return income - expenses;
}

/**
 * Calculate goal progress percentage
 * @param {number} currentAmount - Current amount saved
 * @param {number} targetAmount - Target amount
 * @returns {number} Progress percentage (0-100)
 */
export function calculateGoalProgress(currentAmount, targetAmount) {
  if (!targetAmount || targetAmount === 0) return 0;
  
  const progress = (currentAmount / targetAmount) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
}
