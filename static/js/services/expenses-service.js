// @@ js/services/expenses-services.js

import { COLLECTION } from "../firebase/firebase-dbs.js"

export const expensesService = {
  async addExpense(uid, payload) {
    return firestoreService.add(COLLECTION.TRANSACTIONS, {
      uid,
      type: "expense",
      createdAt: Date.now(),
      ...payload,
    });
  },

  async getExpenses(uid) {
    const all = await firestoreService.getAll(COLLECTION.TRANSACTIONS);
    return all.filter((item) => item.uid === uid && item.type === "expense");
  },
};
