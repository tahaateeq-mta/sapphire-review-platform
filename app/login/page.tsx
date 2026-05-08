"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import { loginWithEmail, loginWithGoogle, sendPasswordReset } from '@/lib/firebase/authService';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { getDashboardRouteForRole } from '@/lib/auth/redirectByRole';
import { ShieldCheck, Mail, Lock, Smartphone } from 'lucide-react';
import { getUserProfile } from '@/lib/firebase/authService';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return setError("Firebase is not configured. Check .env.local.");
    setLoading(true); setError(null);
    try {
      await loginWithEmail(email, password);
      router.push("/store");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) return setError("Firebase is not configured.");
    try {
      const profile = await loginWithGoogle();
      if (profile) router.push(getDashboardRouteForRole(profile.role));
      else router.push("/auth/complete-profile");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email to reset password.");
    setLoading(true); setError(null);
    try {
      await sendPasswordReset(email);
      setResetMessage("If an account exists with this email, a password reset link has been sent.");
      setIsResetMode(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
              <ShieldCheck className="text-blue-500 w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 mt-2 text-sm text-center">Sign in to your Sapphire account.<br/><span className="text-xs text-slate-500">Admins and merchants should sign in using accounts created by the platform administrator.</span></p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm text-center">{error}</div>}
          {resetMessage && <div className="mb-4 p-3 bg-success/10 border border-success/30 text-success rounded-xl text-sm text-center">{resetMessage}</div>}

          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/30 text-warning rounded-xl text-sm text-center">
              Firebase is not connected. Please setup your <code>.env.local</code> variables.
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
               <div>
                <label className="sr-only">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Email address" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-slate-400 text-sm hover:text-white transition">Back to Login</button>
            </form>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="sr-only">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Email address" />
                </div>
              </div>
              
              <div>
                <label className="sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Password" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm px-1">
                <SmoothLink href="/register" className="text-blue-400 hover:text-blue-300 font-medium">Create account</SmoothLink>
                <button type="button" onClick={() => setIsResetMode(true)} className="text-slate-400 hover:text-white transition">Forgot password?</button>
              </div>

              <button type="submit" disabled={loading || !isFirebaseConfigured} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {!isResetMode && (
            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#0d1b2a] text-slate-500">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleGoogleLogin} disabled={!isFirebaseConfigured} className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                   Google
                </button>
                <button onClick={() => router.push('/auth/phone')} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl hover:bg-slate-700 transition-colors border border-white/5 flex items-center justify-center gap-2">
                  <Smartphone size={16} /> Phone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}