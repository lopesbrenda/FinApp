// @@ js/services/category-service.js

import { firestoreService } from "../firebase/firebase-service.js";
import { COLLECTION } from "../firebase/firebase-dbs.js"

export const categoryService = {
  async getCategories(uid) {
    const userCategories = await firestoreService.getAll(COLLECTION.CATEGORIES);
    return userCategories.filter(c => c.uid === uid);
  },

  async addCategory(uid, newCategory) {
    const categories = await this.getCategories(uid);
    if (categories.find(c => c.name === newCategory)) return categories; 
    await firestoreService.add(COLLECTION.CATEGORIES, { uid, name: newCategory, createdAt: Date.now() });
    return this.getCategories(uid);
  }
};
