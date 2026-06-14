import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

function getFirebaseAdmin(): App {
  if (!getApps().length) {
    let credential;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail && projectId) {
      credential = cert({
        projectId,
        clientEmail,
        // Replace escaped newline sequences from .env string representation
        privateKey: privateKey.replace(/\\n/g, '\n').replace(/"/g, ''),
      });
    } else {
      try {
        const path = require('path');
        const fs = require('fs');
        const keyFile = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 'fire_key.json';
        const keyPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), keyFile);
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        credential = cert(serviceAccount);
      } catch (error) {
        throw new Error(
          `Firebase Admin initialization failed: Missing Firebase environment variables or service account key not found at ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 'fire_key.json'}.`
        );
      }
    }

    app = initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } else {
    app = getApps()[0];
  }
  return app;
}

export const adminApp = getFirebaseAdmin();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminBucket = getStorage(adminApp).bucket(
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'coolcalendarplatform.appspot.com'
);
