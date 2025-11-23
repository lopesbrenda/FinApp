// @@ static/js/firebase-db.js
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ============ GENERIC HELPERS ============ */

/**
 * Add a new item to any collection
 * @param {string} collectionName - e.g., "chat", "requests", "users"
 * @param {object} data - the document data
 * @returns {Promise<string>} - created doc id
 */
export async function addItem(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ Added to ${collectionName}:`, docRef.id);
    return docRef.id;
  } catch (err) {
    console.error(`❌ Error adding to ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Get all items from a collection
 * @param {string} collectionName
 * @returns {Promise<Array>}
 */
export async function getItems(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error(`❌ Error fetching ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Delete a document by ID
 * @param {string} collectionName
 * @param {string} docId
 */
export async function deleteItem(collectionName, docId) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    console.log(`🗑️ Deleted from ${collectionName}: ${docId}`);
  } catch (err) {
    console.error(`❌ Error deleting from ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Update an existing document
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} newData
 */
export async function updateItem(collectionName, docId, newData) {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...newData,
      updatedAt: serverTimestamp(),
    });
    console.log(`✏️ Updated ${collectionName}: ${docId}`);
  } catch (err) {
    console.error(`❌ Error updating ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Get documents by user ID (optional utility for user-specific data)
 * @param {string} collectionName
 * @param {string} uid
 */
export async function getItemsByUser(collectionName, uid) {
  try {
    const q = query(collection(db, collectionName), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error(`❌ Error fetching ${collectionName} for user ${uid}:`, err);
    throw err;
  }
}
