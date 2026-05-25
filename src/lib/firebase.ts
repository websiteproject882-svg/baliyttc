// Firebase Configuration
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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

const isTestEmail = (emailStr?: string) => {
  if (!emailStr) return false;
  return ["student@test.com", "teacher@test.com", "admin@baliyttc.com", "owner@baliyttc.com"].includes(emailStr.toLowerCase().trim());
};

const canUseLocalAuthFallback = (email?: string) => {
  if (process.env.NODE_ENV === "production") return false;
  if (!isFirebaseConfigured()) return true;
  if (email && isTestEmail(email)) return true;
  return false;
};

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
  // No Firebase configured: use the explicit test-login route to create a server session.
  if (canUseLocalAuthFallback(email)) {
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal: "student" }),
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

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase auth is not configured. Contact support.");
  }

  // Real Firebase auth
  if (!auth) throw new Error("Auth not initialized");
  const result = await signInWithEmailAndPassword(auth, email, password);
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

export async function sendPortalPasswordReset(email: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter your email address first.");
  }

  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Password reset is not available yet. Contact support.");
  }

  await sendPasswordResetEmail(auth, email);
}

export async function registerWithEmail(email: string, password: string, name: string) {
  if (!isFirebaseConfigured()) {
    if (!canUseLocalAuthFallback()) {
      throw new Error("Firebase auth is not configured");
    }
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
  if (auth) {
    await signOut(auth);
  }

  await fetch("/api/auth/logout", { method: "POST" });
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    if (canUseLocalAuthFallback() && typeof window !== "undefined") {
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

// Local auth helpers are development-only. Production auth must come from a server session.
export function setDemoUser(user: { uid: string; email: string; displayName: string }, role: string) {
  if (canUseLocalAuthFallback() && typeof window !== "undefined") {
    localStorage.setItem("baliyttc_user", JSON.stringify({ user, role }));
  }
}

export function getDemoUser() {
  if (canUseLocalAuthFallback() && typeof window !== "undefined") {
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
