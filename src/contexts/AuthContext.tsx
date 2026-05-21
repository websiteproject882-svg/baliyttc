"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getDemoUser,
  clearDemoUser,
  setDemoUser,
  isFirebaseConfigured,
  type AuthenticatedAppUser,
  type LoginResult,
} from "@/lib/firebase";

type AppUser = AuthenticatedAppUser;

interface AuthContextType {
  user: AppUser | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (challengeToken: string, code: string, pendingUser: AppUser) => Promise<{ role: string; redirectTo: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const stored = getDemoUser();
      if (stored) {
        setUser(stored.user);
        setRole(stored.role);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { loginWithEmail } = await import("@/lib/firebase");
    const result = await loginWithEmail(email, password);
    const appUser: AppUser = result.user;

    if (!result.requiresTwoFactor) {
      setUser(appUser);
      setRole(result.role || "STUDENT");
      if (!isFirebaseConfigured()) {
        setDemoUser(appUser, result.role || "STUDENT");
      }
    }

    return result;
  };

  const verifyTwoFactor = async (challengeToken: string, code: string, pendingUser: AppUser) => {
    const { verifyTwoFactorLogin } = await import("@/lib/firebase");
    const result = await verifyTwoFactorLogin(challengeToken, code);
    setUser(pendingUser);
    setRole(result.role || "STUDENT");
    if (!isFirebaseConfigured()) {
      setDemoUser(pendingUser, result.role || "STUDENT");
    }
    return result;
  };

  const logout = async () => {
    const { logout: firebaseLogout } = await import("@/lib/firebase");
    await firebaseLogout();
    setUser(null);
    setRole(null);
    clearDemoUser();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, verifyTwoFactor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
