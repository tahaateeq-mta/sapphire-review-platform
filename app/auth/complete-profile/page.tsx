"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/animations/PageTransition';
import { useAuth } from '@/components/providers/AuthProvider';
import { createCustomerProfileIfMissing } from '@/lib/firebase/authService';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { currentUser, userProfile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    } else if (!loading && userProfile) {
      router.push("/store");
    } else if (currentUser && !name) {
      setName(currentUser.displayName || "");
    }
  }, [currentUser, userProfile, loading, router, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await createCustomerProfileIfMissing(currentUser, name);
      await refreshProfile();
      router.push("/store");
    } catch (error) {
      console.error("Failed to complete profile", error);
      setIsSubmitting(false);
    }
  };

  if (loading || !currentUser || userProfile) return null;

  return (
    <PageTransition>
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-blue-500/20">
          <h2 className="text-2xl font-black text-white mb-2">Complete Your Profile</h2>
          <p className="text-slate-400 text-sm mb-6">Just one more step to finish setting up your customer account.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 outline-none" placeholder="Enter your full name" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}