import * as admin from 'firebase-admin';

function getPrivateKey() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (
    !privateKey ||
    privateKey.length < 1000 ||
    !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
    !privateKey.includes('-----END PRIVATE KEY-----')
  ) {
    return null;
  }
  return privateKey;
}

const privateKey = getPrivateKey();
const isConfigured =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  privateKey;

if (!admin.apps.length && isConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
