/**
 * Goal Projections Utility
 * 
 * Handles financial projection calculations for goals
 */

/**
 * Calculate projection details for a goal
 * @param {number} targetAmount - Goal target amount
 * @param {number} currentAmount - Current saved amount
 * @param {number} monthlyContribution - Planned monthly contribution
 * @returns {Object} Projection details (remaining, months, years, expectedDate)
 */
export function calculateProjection(targetAmount, currentAmount, monthlyContribution, dueDate) {
  const remaining = Math.max(0, targetAmount - currentAmount);
  
  // Meta já atingida
  if (remaining <= 0) {
    return {
      remaining: 0,
      monthsNeeded: 0,
      years: 0,
      months: 0,
      expectedDate: new Date(),
      isComplete: true
    };
  }
  
  // Se tiver contribuição, projeta com base no valor e na contribuição
  if (monthlyContribution > 0) {
    const monthsNeeded = Math.ceil(remaining / monthlyContribution);
    const years = Math.floor(monthsNeeded / 12);
    const months = monthsNeeded % 12;
    
    const expectedDate = new Date();
    expectedDate.setMonth(expectedDate.getMonth() + monthsNeeded);
    
    return {
      remaining,
      monthsNeeded,
      years,
      months,
      expectedDate,
      isComplete: false
    };
  }
  
  // Sem contribuição: calcula tempo restante até o dueDate
  if (!dueDate) {
    return {
      remaining,
      monthsNeeded: 0,
      years: 0,
      months: 0,
      expectedDate: null,
      isComplete: false
    };
  }

  const now = new Date();
  const endDate = new Date(dueDate);
  
  let monthsRemaining = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
  monthsRemaining = Math.max(0, monthsRemaining);
  
  const years = Math.floor(monthsRemaining / 12);
  const months = monthsRemaining % 12;
  
  return {
    remaining,
    monthsNeeded: monthsRemaining,
    years,
    months,
    expectedDate: endDate,
    isComplete: false
  };
}


/**
 * Calculate projection status (ahead/behind/on-track)
 * @param {Object} goal - Goal object with history and projection data
 * @returns {Object} Status information
 */
export function calculateProjectionStatus(goal) {
  if (!goal.monthlyContribution || goal.monthlyContribution <= 0) {
    return { status: 'no-plan', message: '' };
  }
  
  if (!goal.projectionStartDate) {
    return { status: 'new', message: '' };
  }
  
  const startDate = goal.projectionStartDate.toDate ? goal.projectionStartDate.toDate() : new Date(goal.projectionStartDate);
  const now = new Date();
  
  const monthsSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 30.44));
  
  if (monthsSinceStart < 1) {
    return { status: 'new', message: '' };
  }
  
  const expectedAmount = goal.projectionStartAmount + (goal.monthlyContribution * monthsSinceStart);
  const currentAmount = goal.currentAmount || 0;
  const difference = currentAmount - expectedAmount;
  const percentDiff = (difference / expectedAmount) * 100;
  
  if (percentDiff >= 10) {
    return { 
      status: 'ahead', 
      message: 'ahead_schedule',
      difference: Math.abs(difference),
      monthsSaved: Math.floor(Math.abs(difference) / goal.monthlyContribution)
    };
  } else if (percentDiff <= -10) {
    return { 
      status: 'behind', 
      message: 'behind_schedule',
      difference: Math.abs(difference),
      monthsBehind: Math.floor(Math.abs(difference) / goal.monthlyContribution)
    };
  } else {
    return { 
      status: 'on-track', 
      message: 'on_track'
    };
  }
}

/**
 * Format projection time remaining
 * @param {number} years - Years remaining
 * @param {number} months - Months remaining
 * @param {Object} translations - Translation object
 * @returns {string} Formatted time string
 */
export function formatProjectionTime(years, months, translations) {
  if (years === 0 && months === 0) {
    return translations.goal_achieved || 'Goal achieved!';
  }
  
  const parts = [];
  
  if (years > 0) {
    const yearText = years === 1 ? (translations.year || 'year') : (translations.years || 'years');
    parts.push(`${years} ${yearText}`);
  }
  
  if (months > 0) {
    const monthText = months === 1 ? (translations.month || 'month') : (translations.months || 'months');
    parts.push(`${months} ${monthText}`);
  }
  
  return parts.join(' ' + (translations.and || 'and') + ' ');
}

/**
 * Format expected completion date
 * @param {Date} date - Expected completion date
 * @param {string} locale - Locale string (en-US, pt-BR)
 * @returns {string} Formatted date string
 */
export function formatExpectedDate(date, locale = 'en-US') {
  if (!date) return '';
  
  let dateObj;
  
  // Handle Firestore timestamp
  if (date.toDate && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  }
  // Handle milliseconds timestamp
  else if (typeof date === 'number') {
    dateObj = new Date(date);
  }
  // Handle ISO string or other date string
  else if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  // Already a Date object
  else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  try {
    return dateObj.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'long'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Calculate impact of extra contribution
 * @param {Object} currentProjection - Current projection details
 * @param {number} extraAmount - Extra contribution amount
 * @param {number} monthlyContribution - Regular monthly contribution
 * @returns {Object} New projection and improvement details
 */
export function calculateExtraContributionImpact(currentProjection, extraAmount, monthlyContribution) {
  if (!currentProjection || monthlyContribution <= 0) {
    return null;
  }
  
  const newRemaining = Math.max(0, currentProjection.remaining - extraAmount);
  const newMonthsNeeded = Math.ceil(newRemaining / monthlyContribution);
  const monthsSaved = currentProjection.monthsNeeded - newMonthsNeeded;
  
  const newExpectedDate = new Date();
  newExpectedDate.setMonth(newExpectedDate.getMonth() + newMonthsNeeded);
  
  return {
    monthsSaved,
    newMonthsNeeded,
    newExpectedDate,
    improvement: monthsSaved > 0
  };
}
