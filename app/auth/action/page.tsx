"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';
import { ShieldCheck, Lock, CheckCircle, XCircle } from 'lucide-react';

function PasswordResetHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode'); // The secret code from the email

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify the code is valid when the page loads
  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
      setError("Invalid or missing password reset code.");
      setLoading(false);
      return;
    }

    verifyPasswordResetCode(firebaseAuth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setLoading(false);
      })
      .catch((err) => {
        setError("This password reset link has expired or is invalid. Please request a new one.");
        setLoading(false);
      });
  }, [mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    if (!oobCode) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Verifying reset link...</div>;
  }

  return (
    <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
          {success ? <CheckCircle className="text-success w-8 h-8" /> : <ShieldCheck className="text-blue-500 w-8 h-8" />}
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          {success ? "Password Reset!" : "Reset Password"}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm text-center flex flex-col items-center gap-2">
          <XCircle size={24} />
          <span>{error}</span>
          <SmoothLink href="/login" className="mt-2 text-white font-bold hover:underline">Return to Login</SmoothLink>
        </div>
      )}

      {success ? (
        <div className="text-center space-y-6">
          <p className="text-slate-400 text-sm">Your password has been successfully changed. You can now sign in with your new credentials.</p>
          <button onClick={() => router.push('/login')} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors">
            Go to Login
          </button>
        </div>
      ) : !error && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-400 text-center mb-4">Resetting password for: <strong className="text-white">{email}</strong></p>
          
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" placeholder="New Password (min 6 chars)" />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" placeholder="Confirm New Password" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors mt-2 disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Change Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ActionPage() {
  return (
    <PageTransition>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading handler...</div>}>
          <PasswordResetHandler />
        </Suspense>
      </div>
    </PageTransition>
  );
}