// @@ static/js/pages/category.js
import { categoryService } from "../services/category-service.js";
import { COLLECTION } from "./firebase/firebase-dbs.js";

export async function loadCategories(uid) {
  const categories = await categoryService.getCategories(uid);
// Render DOM
}

export async function addCategory(uid, newCategory) {
  const updated = await categoryService.addCategory(uid, newCategory);
  return updated;
}
