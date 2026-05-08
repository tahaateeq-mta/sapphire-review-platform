"use client";
import React, { useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import { ShieldAlert } from 'lucide-react';

export default function AdminBootstrapPage() {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret })
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Admin profile successfully bootstrapped for ${data.email}. You can now login as Admin.` });
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to bootstrap admin." });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto py-12">
        <div className="glass-panel p-8 rounded-3xl border border-warning/30">
          <div className="flex items-center gap-3 mb-6 text-warning">
            <ShieldAlert size={32} />
            <h1 className="text-3xl font-black text-white">Admin Bootstrap</h1>
          </div>
          
          <div className="bg-warning/10 text-warning p-4 rounded-xl text-sm mb-8 leading-relaxed">
            <strong>Warning:</strong> This setup page creates the Firestore ADMIN profile for an existing Firebase Authentication user. It should be disabled or protected after initial setup in production.
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-success/10 text-success border border-success/20'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleBootstrap} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Target Firebase Auth Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 outline-none" placeholder="admin@sapphire.test" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Bootstrap Secret</label>
              <input type="password" required value={secret} onChange={e => setSecret(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 outline-none" placeholder="Enter ADMIN_BOOTSTRAP_SECRET" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-warning text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition mt-4 disabled:opacity-50">
              {loading ? "Bootstrapping..." : "Bootstrap Admin Profile"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <SmoothLink href="/login" className="text-blue-400 hover:text-white text-sm">Go to Login</SmoothLink>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}