// @@ js/services/goals-services.js

import { COLLECTION } from "../firebase/firebase-dbs.js"

export const goalsService = {
  async addGoal(uid, payload) {
    return firestoreService.add(COLLECTION.BUDGET, {
      uid,
      createdAt: Date.now(),
      ...payload,
    });
  },

  async getGoals(uid) {
    const all = await firestoreService.getAll(COLLECTION.BUDGET);
    return all.filter((item) => item.uid === uid);
  },
};
