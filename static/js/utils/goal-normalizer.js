/**
 * Goal Record Normalizer
 * 
 * Ensures consistent data types for projection calculations
 */

/**
 * Normalize a goal record for projection calculations
 * @param {Object} goal - Raw goal from Firestore
 * @returns {Object} Normalized goal with consistent date types
 */
export function normalizeGoalRecord(goal) {
  if (!goal) return null;
  
  const normalized = { ...goal };
  
  const convertToDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value.toDate) return value.toDate();
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    return null;
  };
  
  normalized.createdAt = convertToDate(goal.createdAt);
  normalized.completedAt = convertToDate(goal.completedAt);
  normalized.archivedAt = convertToDate(goal.archivedAt);
  
  if (goal.projectionStartDate) {
    normalized.projectionStartDate = convertToDate(goal.projectionStartDate);
  } else if (goal.localProjectionStartAt) {
    normalized.projectionStartDate = convertToDate(goal.localProjectionStartAt);
  }
  
  if (!normalized.projectionStartDate && normalized.currentAmount) {
    normalized.projectionStartDate = normalized.createdAt || new Date();
    normalized.projectionStartAmount = 0;
  }
  
  if (normalized.projectionStartAmount === undefined || normalized.projectionStartAmount === null) {
    normalized.projectionStartAmount = 0;
  }
  
  return normalized;
}

/**
 * Normalize an array of goal records
 * @param {Array} goals - Array of raw goals from Firestore
 * @returns {Array} Array of normalized goals
 */
export function normalizeGoalRecords(goals) {
  if (!Array.isArray(goals)) return [];
  return goals.map(normalizeGoalRecord).filter(Boolean);
}

/**
 * Persist missing projection fields for legacy goals
 * @param {Array} goals - Array of normalized goals
 * @param {Function} updateGoal - Goal update function
 */
export async function persistLegacyProjectionFields(goals, updateGoal) {
  const legacyGoals = goals.filter(g => 
    (!g.localProjectionStartAt || !g.projectionStartDate) && g.id
  );
  
  const updates = legacyGoals.map(async (goal) => {
    try {
      const now = Date.now();
      const { serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js');
      
      const updates = {};
      if (!goal.localProjectionStartAt) {
        updates.localProjectionStartAt = now;
      }
      if (!goal.projectionStartDate) {
        updates.projectionStartDate = serverTimestamp();
      }
      if (goal.projectionStartAmount === undefined || goal.projectionStartAmount === null) {
        updates.projectionStartAmount = goal.currentAmount || 0;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateGoal(goal.id, updates);
      }
    } catch (error) {
      console.warn(`Failed to persist projection fields for goal ${goal.id}:`, error);
    }
  });
  
  await Promise.allSettled(updates);
}
