// @@ static/js/firebase/firebase-dbs.js

import { COLLECTIONS } from "/collections.js";

export const COLLECTION = {
  BUDGET: COLLECTIONS.budgetCollection,
  CATEGORIES: COLLECTIONS.categoryCollection,
  CURRENCY: COLLECTIONS.currencyCollection,
  GOALS: COLLECTIONS.goalsCollection,
  TRANSACTIONS: COLLECTIONS.transactionCollection,
  USERS: COLLECTIONS.userCollection,
  ACTIVITY_LOG: COLLECTIONS.activityLogsCollection,
};

export const spbs = {
  SUPABASE_URL: "https://zmmthhanacvcefxmpbau.supabase.co",
  SUPABASE_PUBLIC_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptbXRoaGFuYWN2Y2VmeG1wYmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzczMDUsImV4cCI6MjA3OTI1MzMwNX0.l5hmeD2fHRdrVMK2b6ESTLduzsNrXd6w7VAKJdcjVD8",
  SUPABASE_BUCKET: "avatars"
};
