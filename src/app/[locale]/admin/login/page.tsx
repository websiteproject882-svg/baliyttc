"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BalieytcLogo } from "@/components/shared/BalieytcLogo";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { isFirebaseConfigured, sendPortalPasswordReset } from "@/lib/firebase";
import { withLocalePath } from "@/lib/localized-path";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "en";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const canUseTestLogin = true;
  
  const isTestEmail = (emailStr: string) => {
    return ["admin@baliyttc.com", "owner@baliyttc.com"].includes(emailStr.toLowerCase().trim());
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleTestLogin = async (email: string, password: string) => {
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal: "admin" }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success || !data?.isAdmin) {
      throw new Error(data?.error || "Login failed");
    }

    return data;
  };

  const readAuthResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json().catch(() => null);
    }

    const text = await response.text().catch(() => "");
    return {
      error: response.ok
        ? "Login response was not valid JSON. Please refresh and try again."
        : text.includes("<!DOCTYPE")
          ? "Login service returned a page instead of JSON. Please refresh and try again."
          : text || "Login service returned an unexpected response.",
    };
  };

  const handleLogin = async (email: string, password: string) => {
    const isDev = process.env.NODE_ENV !== "production";
    const useTest = isTestEmail(email) || (isDev && !isFirebaseConfigured());

    if (useTest) {
      return handleTestLogin(email, password);
    }

    if (!isFirebaseConfigured()) {
      throw new Error("Firebase auth is not configured. Contact support.");
    }

    const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    const response = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await readAuthResponse(response);

    if (!response.ok) {
      throw new Error(data?.error || "Login failed");
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
        title: "Admin login successful!",
        description: "Redirecting to admin dashboard...",
      });

      router.push(withLocalePath(data.redirectTo || "/admin/overview", locale));
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

      const data = await readAuthResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || "Verification failed");
      }

      toast({
        title: "Verification successful",
        description: "Redirecting to admin dashboard...",
      });
      router.push(withLocalePath(data.redirectTo || "/admin/overview", locale));
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

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      await sendPortalPasswordReset(email);
      toast({
        title: "Password reset sent",
        description: "Check your inbox for the reset link.",
      });
    } catch (error) {
      toast({
        title: "Password reset unavailable",
        description: error instanceof Error ? error.message : "Contact the owner to reset your password.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <NextLayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <BalieytcLogo className="h-12 w-12" showText={false} />
            </div>
            <h1 className="font-serif text-3xl text-white font-bold">Admin Portal</h1>
            <p className="text-slate-400 mt-2">Owner access only</p>
          </div>

          {canUseTestLogin && (
            <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-400 font-medium mb-2">Test Credentials:</p>
              <div className="text-xs text-amber-300 space-y-1">
                <p><strong>Admin:</strong> admin@baliyttc.com / admin123</p>
              </div>
            </div>
          )}

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-serif text-center text-white flex items-center justify-center gap-2">
                <ShieldCheck className="h-6 w-6 text-amber-500" />
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Access the admin control panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingChallenge ? (
                <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-slate-300 font-medium">
                      Authentication Code
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="bg-slate-900 border-slate-600 text-white text-center text-2xl tracking-widest"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-slate-500">Open your authenticator app and enter the current 6-digit code.</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold h-11"
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
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
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
                    <Label htmlFor="email" className="text-slate-300 font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        className={`pl-10 bg-slate-900 border-slate-600 text-white ${
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-300 font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={isResettingPassword}
                        className="text-sm font-medium text-amber-400 hover:text-amber-300"
                      >
                        {isResettingPassword ? "Sending..." : "Forgot password?"}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className={`pl-10 pr-10 bg-slate-900 border-slate-600 text-white ${
                          errors.password ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
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
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In to Admin"
                    )}
                  </Button>
                </form>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </NextLayoutWrapper>
  );
}
