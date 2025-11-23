// @@ static/js/chat.js
import { db } from "./firebase-config.js";
import { CHAT_COLLECTION } from "./firebase-dbs.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/** Send a new chat message */
export async function sendMessage(uid, message, sender = "user") {
  try {
    await addDoc(collection(db, CHAT_COLLECTION), {
      uid,
      message,
      sender,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    throw err;
  }
}

/** Get all messages for a user (ordered by time) */
export async function getUserMessages(uid) {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      where("uid", "==", uid),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    throw err;
  }
}