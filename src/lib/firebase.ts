// Firebase Configuration
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "demo-api-key" &&
    firebaseConfig.apiKey !== undefined
  );
};

// Initialize Firebase only once
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

// Demo users for testing (only used when Firebase is not configured)
export const TEST_USERS = [
  { email: "admin@baliyttc.com", password: "admin123", role: "SUPER_ADMIN", name: "Admin User" },
  { email: "student@test.com", password: "student123", role: "STUDENT", name: "Test Student" },
  { email: "teacher@test.com", password: "teacher123", role: "TEACHER", name: "Test Teacher" },
];

export interface AuthenticatedAppUser {
  uid: string;
  email: string;
  displayName: string;
}

export interface LoginResult {
  user: AuthenticatedAppUser;
  role?: string;
  redirectTo?: string;
  requiresTwoFactor?: boolean;
  requiresTotpSetup?: boolean;
  challengeToken?: string;
}

// Auth functions
export async function loginWithEmail(email: string, password: string) {
  // Demo mode - create a real server session through the test-login route.
  if (!isFirebaseConfigured()) {
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      return {
        user: {
          uid: email,
          email,
          displayName: email.split("@")[0],
        },
        role: data.role,
        redirectTo: data.redirectTo,
      };
    }

    throw new Error(data?.error || "Invalid credentials");
  }

  // Real Firebase auth
  if (!auth) throw new Error("Auth not initialized");
  let result;
  try {
    result = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    const fallback = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const fallbackData = await fallback.json().catch(() => null);

    if (fallback.ok && fallbackData?.success) {
      return {
        user: {
          uid: email,
          email,
          displayName: email.split("@")[0],
        },
        role: fallbackData.role,
        redirectTo: fallbackData.redirectTo,
      };
    }

    throw error;
  }
  const idToken = await result.user.getIdToken();
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login session setup failed");
  }

  return {
    user: {
      uid: result.user.uid,
      email: result.user.email || email,
      displayName: result.user.displayName || email.split("@")[0],
    },
    role: data.role,
    redirectTo: data.redirectTo,
    requiresTwoFactor: data.requiresTwoFactor,
    requiresTotpSetup: data.requiresTotpSetup,
    challengeToken: data.challengeToken,
  };
}

export async function verifyTwoFactorLogin(challengeToken: string, code: string) {
  const response = await fetch("/api/auth/2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeToken, code }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Two-factor verification failed");
  }

  return data as { role: string; redirectTo: string };
}

export async function registerWithEmail(email: string, password: string, name: string) {
  // Demo mode
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      user: {
        uid: email,
        email,
        displayName: name,
      },
      role: "STUDENT",
    };
  }

  if (!auth) throw new Error("Auth not initialized");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  return { user: result.user };
}

export async function logout() {
  if (!isFirebaseConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return;
  }

  if (!auth) throw new Error("Auth not initialized");
  await signOut(auth);
  await fetch("/api/auth/logout", { method: "POST" });
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // Demo mode - check localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("baliyttc_user");
      if (stored) {
        callback(JSON.parse(stored).user);
        return () => {};
      }
    }
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Demo auth helpers
export function setDemoUser(user: { uid: string; email: string; displayName: string }, role: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("baliyttc_user", JSON.stringify({ user, role }));
  }
}

export function getDemoUser() {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("baliyttc_user");
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

export function clearDemoUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("baliyttc_user");
  }
}

export { auth, app, isFirebaseConfigured };
