import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app';
import serviceAccount from "./firebase.config.json"

const app = initializeApp({
  // @ts-ignore
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
export { db };
