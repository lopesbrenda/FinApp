// @@ static/js/firestore-utils.js
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/**
 * Add new item to a collection.
 * @param {string} colName - Name of the collection (e.g. 'expenses', 'requests').
 * @param {Object} data - Object to be added.
 */
export async function addItem(colName, data) {
  try {
    const docRef = await addDoc(collection(db, colName), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ Added new item to ${colName}:`, docRef.id);
    return docRef.id;
  } catch (err) {
    console.error(`❌ Error adding to ${colName}:`, err);
    throw err;
  }
}

/**
 * Get items by userId or all if no filter.
 * @param {string} colName - Collection name.
 * @param {string} [userId] - Optional userId to filter by.
 */
export async function getItems(colName, userId = null) {
  try {
    let q;
    if (userId) {
      q = query(collection(db, colName), where("userId", "==", userId));
    } else {
      q = collection(db, colName);
    }
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`📄 Fetched ${results.length} items from ${colName}`);
    return results;
  } catch (err) {
    console.error(`❌ Error fetching ${colName}:`, err);
    throw err;
  }
}

/**
 * Delete item by document ID.
 * @param {string} colName - Collection name.
 * @param {string} id - Document ID.
 */
export async function deleteItem(colName, id) {
  try {
    await deleteDoc(doc(db, colName, id));
    console.log(`🗑️ Deleted item ${id} from ${colName}`);
  } catch (err) {
    console.error(`❌ Error deleting from ${colName}:`, err);
    throw err;
  }
}

/**
 * Update an item.
 * @param {string} colName
 * @param {string} id
 * @param {Object} data
 */
export async function updateItem(colName, id, data) {
  try {
    const docRef = doc(db, colName, id);
    await updateDoc(docRef, data);
    console.log(`✏️ Updated ${colName}/${id}`);
  } catch (err) {
    console.error(`❌ Error updating ${colName}:`, err);
    throw err;
  }
}
