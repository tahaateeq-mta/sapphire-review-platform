"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";

import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import {
  getUserProfile,
  loginWithEmail,
  loginWithGoogle,
  sendPasswordReset,
} from "@/lib/firebase/authService";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getDashboardRouteForRole } from "@/lib/auth/redirectByRole";
import type { UserProfile } from "@/lib/types";

function getFriendlyAuthError(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";

      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/too-many-requests":
        return "Too many login attempts. Please wait a bit and try again.";

      case "auth/popup-closed-by-user":
        return "Google sign-in was closed before completion.";

      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again.";

      default:
        return error.message || "Authentication failed. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function getProfileAfterLogin(): Promise<UserProfile | null> {
  const user = firebaseAuth.currentUser;

  if (!user?.uid) {
    return null;
  }

  return getUserProfile(user.uid);
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const clearMessages = () => {
    setError(null);
    setResetMessage(null);
  };

  const redirectAfterLogin = async () => {
    const profile = await getProfileAfterLogin();

    if (profile?.role) {
      router.replace(getDashboardRouteForRole(profile.role));
    } else {
      router.replace("/auth/complete-profile");
    }

    router.refresh();
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    clearMessages();

    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Check your .env.local file.");
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await loginWithEmail(cleanEmail, password);
      await redirectAfterLogin();
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();

    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Check your .env.local file.");
      return;
    }

    try {
      setGoogleLoading(true);

      await loginWithGoogle();
      await redirectAfterLogin();
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    clearMessages();

    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Check your .env.local file.");
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email to reset your password.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordReset(cleanEmail);

      setResetMessage(
        "If an account exists with this email, a password reset link has been sent."
      );

      setIsResetMode(false);
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const disableActions = loading || googleLoading || !isFirebaseConfigured;

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[75vh] w-full max-w-6xl items-center justify-center overflow-x-hidden px-0 py-6 sm:py-10">
        <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/20">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white">
              {isResetMode ? "Reset Password" : "Welcome Back"}
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {isResetMode
                ? "Enter your email and we will send a password reset link."
                : "Sign in to your Sapphire account."}
            </p>

            {!isResetMode && (
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                Admins and merchants should sign in using accounts created by
                the platform administrator.
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm leading-6 text-red-400">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center text-sm leading-6 text-green-400">
              {resetMessage}
            </div>
          )}

          {!isFirebaseConfigured && (
            <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center text-sm leading-6 text-yellow-400">
              Firebase is not connected. Please check your{" "}
              <code className="rounded bg-black/20 px-1 py-0.5 text-xs">
                .env.local
              </code>{" "}
              variables.
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="sr-only">
                  Email address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={disableActions}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setIsResetMode(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="sr-only">
                  Email address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="sr-only">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <SmoothLink
                  href="/register"
                  className="font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Create account
                </SmoothLink>

                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setIsResetMode(true);
                  }}
                  className="text-left text-slate-400 transition hover:text-white sm:text-right"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={disableActions}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {!isResetMode && (
            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>

                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#0d1b2a] px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={disableActions}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {googleLoading ? "Opening..." : "Google"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/auth/phone")}
                  disabled={loading || googleLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-800 py-3 font-bold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Smartphone size={16} />
                  Phone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}