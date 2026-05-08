"use client";
import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import RequireRole from '@/components/auth/RequireRole';
import { useAuth } from '@/components/providers/AuthProvider';
import { createMerchantAsAdmin, getMerchants } from '@/lib/firebase/services/merchantService';
import SmoothLink from '@/components/animations/SmoothLink';
import { Store, PlusCircle, ExternalLink } from 'lucide-react';

export default function ManageMerchantsPage() {
  const { currentUser } = useAuth();
  
  // Form State
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  // Directory State (Removed "any" type for better stability)
  const [merchants, setMerchants] = useState<Record<string, any>[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);

  const fetchDirectory = async () => {
    try {
      const data = await getMerchants();
      setMerchants(data);
    } catch (err) {
      console.error("Failed to load merchants", err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => { 
    fetchDirectory(); 
  }, []);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true); 
    setMessage(null);
    
    try {
      const idToken = await currentUser.getIdToken();
      await createMerchantAsAdmin({ businessName, contactName, email, password, phone }, idToken);
      setMessage({ type: 'success', text: `Merchant account created successfully for ${email}.` });
      
      // Clear form
      setBusinessName(""); setContactName(""); setEmail(""); setPassword(""); setPhone("");
      
      // Refresh the directory list
      fetchDirectory(); 
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireRole allowedRoles={['ADMIN']}>
      <PageTransition>
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Store className="text-purple-400" size={36}/> Manage Merchants
            </h1>
            <SmoothLink href="/admin/dashboard" className="text-slate-400 hover:text-white transition">Back to Dashboard</SmoothLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create Merchant Form */}
            <div className="md:col-span-1 glass-panel p-6 rounded-3xl border border-white/5 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-blue-400"/> Create Merchant
              </h2>
              
              {message && (
                <div className={`p-3 rounded-xl text-sm mb-4 ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-success/10 text-success'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleCreateMerchant} className="space-y-4">
                <div><label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Business Name</label><input type="text" required value={businessName} onChange={e=>setBusinessName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Contact Name</label><input type="text" required value={contactName} onChange={e=>setContactName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Email Address</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Temporary Password</label><input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="Min 6 chars" /></div>
                <div><label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Phone (Optional)</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition disabled:opacity-50 mt-4">
                  {loading ? "Creating..." : "Create Merchant Account"}
                </button>
              </form>
            </div>

            {/* Merchant Directory List */}
            <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6">Merchant Directory</h3>
              
              {loadingDirectory ? (
                <div className="text-center py-10 text-slate-400">Loading directory...</div>
              ) : merchants.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No merchants created yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-slate-400 text-xs uppercase font-semibold border-b border-white/5">
                      <tr><th className="px-4 py-3">Business</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {merchants.map((m) => (
                        <tr key={m.id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-4"><p className="font-bold text-white">{m.businessName}</p><p className="text-xs text-slate-500 font-mono mt-1">{m.id}</p></td>
                          <td className="px-4 py-4"><p className="text-slate-300">{m.contactName}</p><p className="text-xs text-slate-500">{m.email}</p></td>
                          <td className="px-4 py-4"><span className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded text-xs font-bold">{m.status}</span></td>
                          <td className="px-4 py-4 text-right">
                            <button className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 justify-end w-full">
                              View Products <ExternalLink size={12}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </PageTransition>
    </RequireRole>
  );
}