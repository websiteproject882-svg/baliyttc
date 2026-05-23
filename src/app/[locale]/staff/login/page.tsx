"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BalieytcLogo } from "@/components/shared/BalieytcLogo";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, Users } from "lucide-react";
import { getRoleHomePath } from "@/lib/rbac";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const canUseTestLogin = process.env.NODE_ENV !== "production" && !isFirebaseConfigured();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleTestLogin = async (email: string, password: string) => {
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success || data?.authType !== "staff") {
      throw new Error(data?.error || "Login failed");
    }

    return data;
  };

  const handleLogin = async (email: string, password: string) => {
    if (canUseTestLogin) {
      return handleTestLogin(email, password);
    }

    if (!isFirebaseConfigured()) {
      throw new Error("Firebase auth is not configured. Contact support.");
    }

    const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    const response = await fetch("/api/auth/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }

    setIsLoading(true);

    try {
      const data = await handleLogin(email, password);

      if (data.requiresTwoFactor && data.challengeToken) {
        setPendingChallenge(data.challengeToken);
        setPendingUser({ uid: "", email, displayName: "" });
        toast({
          title: "Two-factor authentication required",
          description: "Enter the 6-digit code from your authenticator app.",
        });
        return;
      }

      toast({
        title: "Login successful!",
        description: "Redirecting to your dashboard...",
      });

      router.push(data.redirectTo || getRoleHomePath(data.role));
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingChallenge || !twoFactorCode) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken: pendingChallenge, code: twoFactorCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      toast({
        title: "Verification successful",
        description: "Redirecting to your dashboard...",
      });
      router.push(data.redirectTo || getRoleHomePath(data.role));
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid authentication code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NextLayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <BalieytcLogo className="h-12 w-12" showText={false} />
            </div>
            <h1 className="font-serif text-3xl text-white font-bold">Staff Portal</h1>
            <p className="text-emerald-300 mt-2">Teacher, Editor & Manager Access</p>
          </div>

          {canUseTestLogin && (
            <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-400 font-medium mb-2">Test Credentials:</p>
              <div className="text-xs text-amber-300 space-y-1">
                <p><strong>Teacher:</strong> teacher@test.com / teacher123</p>
              </div>
            </div>
          )}

          <Card className="border-emerald-700 bg-emerald-900/50 backdrop-blur shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-serif text-center text-white flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-emerald-400" />
                Staff Login
              </CardTitle>
              <CardDescription className="text-center text-emerald-300">
                Sign in to access your work dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingChallenge ? (
                <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-emerald-100 font-medium">
                      Authentication Code
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="bg-emerald-950 border-emerald-600 text-white text-center text-2xl tracking-widest"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-emerald-400">Open your authenticator app and enter the current 6-digit code.</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-emerald-600 text-emerald-100 hover:bg-emerald-800"
                    onClick={() => {
                      setPendingChallenge(null);
                      setPendingUser(null);
                      setTwoFactorCode("");
                    }}
                  >
                    Back
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-emerald-100 font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="staff@company.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        className={`pl-10 bg-emerald-950 border-emerald-600 text-white ${
                          errors.email ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-sm">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-emerald-100 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className={`pl-10 pr-10 bg-emerald-950 border-emerald-600 text-white ${
                          errors.password ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-sm">{errors.password}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In to Staff Portal"
                    )}
                  </Button>
                </form>
              )}

              {/* Info box */}
              <div className="mt-6 p-4 bg-emerald-900/50 rounded-lg border border-emerald-700">
                <p className="text-xs text-emerald-300 text-center">
                  <strong>Note:</strong> If your account is disabled, contact the admin to enable it.
                  Only authorized staff members can access this portal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </NextLayoutWrapper>
  );
}
