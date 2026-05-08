"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getOrdersForCustomer } from '@/lib/firebase/services/orderService';
import { getReviewsForCustomer, markReviewResolved, withdrawReview } from '@/lib/firebase/services/reviewService';
import { Order, Review } from '@/lib/types';
import PageTransition from '@/components/animations/PageTransition';
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import SmoothLink from '@/components/animations/SmoothLink';

export default function CustomerProfilePage() {
  const { userProfile, currentUser } = useAuth() as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    if (process.env.NEXT_PUBLIC_DATA_MODE === "firebase" && currentUser) {
      try {
        const [o, r] = await Promise.all([
          getOrdersForCustomer(currentUser.uid),
          getReviewsForCustomer(currentUser.uid)
        ]);
        setOrders(o);
        setReviews(r);
      } catch (err) {
        console.error("Error loading profile data:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleAction = async (reviewId: string, action: 'resolve' | 'withdraw') => {
    if (!currentUser) return;
    setActionLoading(reviewId);
    try {
      if (action === 'resolve') {
        await markReviewResolved(reviewId, currentUser.uid);
      } else {
        await withdrawReview(reviewId, currentUser.uid);
      }
      await loadData(); // Refresh list to show updated status
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-white gap-3">
      <Loader2 className="animate-spin text-blue-500" /> Loading profile...
    </div>
  );

  if (!userProfile) return <div className="p-10 text-white text-center">Please log in to view your profile.</div>;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Header Stats */}
        <section className="glass-panel p-8 rounded-3xl border border-white/5 bg-blue-500/5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-white">{userProfile.name}</h1>
              <p className="text-slate-400 font-mono text-sm mt-1">ID: {userProfile.publicId}</p>
              <p className="text-slate-500 text-xs mt-1 italic">{userProfile.email}</p>
            </div>
            <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-green-500/20 uppercase">
              {userProfile.status}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 bg-black/40 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Total Purchases</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="p-4 bg-black/40 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Reviews Written</p>
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
            </div>
          </div>
        </section>

        {/* Reviews Management */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white">Manage My Reviews</h2>
          {reviews.length === 0 ? (
            <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-slate-500">
              You haven't written any reviews yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map(r => {
                // Type casting to bypass static interface status restrictions
                const currentStatus = r.status as string;
                const isFinal = ['RESOLVED', 'WITHDRAWN', 'STRICKEN'].includes(currentStatus);
                
                return (
                  <div key={r.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-500 text-xs">{"★".repeat(r.rating)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          currentStatus === 'RESOLVED' ? 'bg-green-500/10 text-green-400' : 
                          currentStatus === 'WITHDRAWN' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {currentStatus}
                        </span>
                      </div>
                      <h3 className="text-white font-bold">{r.title}</h3>
                      <p className="text-slate-500 text-xs font-mono mt-1">Review ID: {r.id.slice(0,8)}...</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <SmoothLink href={`/review/${r.id}/timeline`} className="p-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition">
                        <Eye size={18} />
                      </SmoothLink>
                      
                      {!isFinal && (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleAction(r.id, 'resolve')}
                            disabled={actionLoading === r.id}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-green-600/20 text-green-400 text-xs rounded-lg font-bold hover:bg-green-600 hover:text-white transition flex items-center justify-center gap-2 border border-green-500/20"
                          >
                            {actionLoading === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Mark Resolved
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleAction(r.id, 'withdraw')}
                            disabled={actionLoading === r.id}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-red-600/20 text-red-400 text-xs rounded-lg font-bold hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2 border border-red-500/20"
                          >
                            {actionLoading === r.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Withdraw
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}