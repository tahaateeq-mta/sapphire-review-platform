"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getReviewsForMerchant, createMerchantReply, openDispute } from '@/lib/firebase/services/reviewService';
import { getMerchantProducts } from '@/lib/firebase/services/productService';
import { Review, Product } from '@/lib/types';
import RequireRole from '@/components/auth/RequireRole';
import { Loader2, MessageSquare, AlertTriangle, Eye } from 'lucide-react';
import SmoothLink from '@/components/animations/SmoothLink';

export default function MerchantDashboard() {
  const { userProfile } = useAuth() as any;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<{ type: 'REPLY' | 'DISPUTE', review: Review } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ content: '', reason: 'Fake claim' });

  const loadData = async () => {
    if (userProfile?.merchantId) {
      try {
        const [r, p] = await Promise.all([
          getReviewsForMerchant(userProfile.merchantId),
          getMerchantProducts(userProfile.uid)
        ]);
        setReviews(r);
        setProducts(p);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal || !userProfile?.merchantId) return;
    
    setModalLoading(true);
    try {
      if (activeModal.type === 'REPLY') {
        if (formData.content.length < 10) throw new Error("Reply must be at least 10 characters.");
        await createMerchantReply({
          reviewId: activeModal.review.id,
          merchantId: userProfile.merchantId,
          content: formData.content
        });
      } else {
        if (formData.content.length < 15) throw new Error("Dispute description must be at least 15 characters.");
        await openDispute({
          reviewId: activeModal.review.id,
          merchantId: userProfile.merchantId,
          reason: formData.reason,
          description: formData.content
        });
      }
      setActiveModal(null);
      setFormData({ content: '', reason: 'Fake claim' });
      await loadData(); // Refresh
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-white"><Loader2 className="animate-spin inline text-blue-500 mr-2" /> Loading Dashboard...</div>;
  if (!userProfile?.merchantId) return <div className="p-10 text-white">Incomplete Merchant Profile. Contact Admin.</div>;

  return (
    <RequireRole allowedRoles={['MERCHANT']}>
      <div className="p-8 space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Merchant Command Center</h1>
            <p className="text-slate-400 font-mono text-sm">Merchant ID: {userProfile.merchantId}</p>
          </div>
        </header>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="glass-panel p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
             <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Live Products</p>
             <p className="text-3xl font-black text-white">{products.filter(p => p.status === 'ACTIVE').length}</p>
           </div>
           <div className="glass-panel p-6 rounded-2xl border border-white/5">
             <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Reviews</p>
             <p className="text-3xl font-black text-white">{reviews.length}</p>
           </div>
        </div>

        {/* Review Management List */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-slate-500 italic p-12 border border-dashed border-white/10 rounded-2xl text-center">No customer reviews found yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => {
                // Type casting to bypass old interface restrictions
                const currentStatus = rev.status as string;
                return (
                  <div key={rev.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between gap-6 hover:border-white/10 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-yellow-500 text-sm">{"★".repeat(rev.rating)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border ${
                          currentStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          currentStatus === 'DISPUTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>{currentStatus}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg">{rev.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{rev.content}</p>
                      <p className="text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-tighter">UID: {rev.userId.slice(0,12)}...</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <SmoothLink href={`/review/${rev.id}/timeline`} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition">
                        <Eye size={20} />
                      </SmoothLink>
                      
                      {currentStatus !== 'WITHDRAWN' && currentStatus !== 'STRICKEN' && (
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setActiveModal({ type: 'REPLY', review: rev })}
                            className="px-5 py-3 bg-blue-600/10 text-blue-400 text-sm rounded-xl hover:bg-blue-600 hover:text-white transition font-bold flex items-center gap-2 border border-blue-500/20"
                          >
                            <MessageSquare size={18} /> Reply
                          </button>
                          <button 
                            type="button"
                            onClick={() => setActiveModal({ type: 'DISPUTE', review: rev })}
                            disabled={currentStatus === 'DISPUTED'}
                            className="px-5 py-3 bg-red-600/10 text-red-400 text-sm rounded-xl hover:bg-red-600 hover:text-white transition font-bold flex items-center gap-2 border border-red-500/20 disabled:opacity-30"
                          >
                            <AlertTriangle size={18} /> Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Action Modal Overlay */}
        {activeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                {activeModal.type === 'REPLY' ? 'Merchant Response' : 'Open Dispute'}
              </h2>
              <p className="text-slate-400 text-sm mb-6">Review for: "{activeModal.review.title}"</p>
              
              <form onSubmit={handleModalSubmit} className="space-y-4">
                {activeModal.type === 'DISPUTE' && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Reason for Dispute</label>
                    <select 
                      value={formData.reason} 
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                    >
                      {['Abusive language', 'Fake claim', 'Irrelevant review', 'Duplicate review', 'Policy violation'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">
                    {activeModal.type === 'REPLY' ? 'Your Response' : 'Dispute Description'}
                  </label>
                  <textarea 
                    required
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    rows={4}
                    placeholder={activeModal.type === 'REPLY' ? "Address the customer's concerns..." : "Explain why this review should be investigated..."}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 px-6 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition">Cancel</button>
                  <button type="submit" disabled={modalLoading} className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/40">
                    {modalLoading ? "Processing..." : "Submit Action"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}