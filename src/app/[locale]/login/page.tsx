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
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/rbac";
import { isFirebaseConfigured, sendPortalPasswordReset } from "@/lib/firebase";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";
import { withLocalePath } from "@/lib/localized-path";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "en";
  const { login, verifyTwoFactor } = useAuth();
  const siteSettings = usePublicSiteSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const showTestCredentials = process.env.NODE_ENV !== "production";

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
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
    if (password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.requiresTwoFactor && result.challengeToken) {
        setPendingChallenge(result.challengeToken);
        setPendingUser(result.user);
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

      router.push(withLocalePath(result.redirectTo || getRoleHomePath(result.role || "STUDENT"), locale));
    } catch (error: any) {
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

    if (!pendingChallenge || !pendingUser) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyTwoFactor(pendingChallenge, twoFactorCode, pendingUser);
      toast({
        title: "Verification successful",
        description: "Redirecting to your dashboard...",
      });
      router.push(withLocalePath(result.redirectTo || getRoleHomePath(result.role), locale));
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
        description: error instanceof Error ? error.message : "Contact support to reset your password.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <NextLayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <BalieytcLogo className="h-12 w-12" showText={false} />
            </div>
            <h1 className="font-serif text-3xl text-gray-900 font-bold">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your Bali YTTC account</p>
          </div>

          {showTestCredentials && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 font-medium mb-2">Test Credentials:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Student:</strong> student@test.com / student123</p>
              </div>
            </div>
          )}

          <Card className="border-amber-100 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-serif text-center">Student Login</CardTitle>
              <CardDescription className="text-center">
                Access your enrolled courses and certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingChallenge ? (
                <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-gray-700 font-medium">
                      Authentication Code
                    </Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="bg-white border-2 border-gray-200 focus:border-amber-400"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-gray-500">Open your authenticator app and enter the current 6-digit code.</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold h-11"
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
                    className="w-full"
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
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`pl-10 bg-white border-2 ${
                        errors.email
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-amber-400"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isResettingPassword}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      {isResettingPassword ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      className={`pl-10 pr-10 bg-white border-2 ${
                        errors.password
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-amber-400"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              )}

              {/* Register Link */}
              <p className="text-center text-sm text-gray-600 mt-6">
                Don&apos;t have an account?{" "}
                <a href={`/${locale}/contact`} className="text-amber-600 hover:text-amber-700 font-semibold">
                  Apply Now
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Need help?{" "}
            <a href={`mailto:${siteSettings.general.email}`} className="text-amber-600 hover:text-amber-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </NextLayoutWrapper>
  );
}
