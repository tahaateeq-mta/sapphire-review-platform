"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getOrder } from '@/lib/firebase/services/orderService';
import { getPoPTokenForOrder } from '@/lib/firebase/services/popTokenService';
import { submitVerifiedReview, getReviewForOrder } from '@/lib/firebase/services/reviewService';
import StarRatingInput from '@/components/ui/StarRatingInput';
import PageTransition from '@/components/animations/PageTransition';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SubmitReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth() as any;

  const [order, setOrder] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    async function validateEligibility() {
      const orderId = params.orderId as string;
      if (!orderId || !currentUser) return;

      try {
        // 1. Fetch Order and Context
        const [orderData, existingReview, tokenData] = await Promise.all([
          getOrder(orderId),
          getReviewForOrder(orderId),
          getPoPTokenForOrder(orderId)
        ]);

        if (!orderData) {
          setError("Order record not found.");
        } else if (orderData.userId !== currentUser.uid) {
          setError("You do not have permission to review this order.");
        } else if (existingReview) {
          setError("A review has already been submitted for this purchase.");
        } else if (!tokenData || tokenData.status !== 'ACTIVE') {
          setError("No active Proof-of-Purchase token found. Reviews require a valid token.");
        } else {
          setOrder(orderData);
          setToken(tokenData);
        }
      } catch (err) {
        setError("Failed to verify review eligibility.");
      } finally {
        setLoading(false);
      }
    }

    validateEligibility();
  }, [params.orderId, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser || !order) return;
    if (content.length < 20) return setError("Review content must be at least 20 characters.");

    setSubmitting(true);
    setError(null);

    try {
      await submitVerifiedReview({
        orderId: order.id,
        productId: order.productId,
        userId: currentUser.uid,
        merchantId: order.merchantId,
        tokenId: token.id,
        rating,
        title,
        content
      });

      router.push('/customer/orders?success=review_submitted');
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-white gap-3">
      <Loader2 className="animate-spin text-blue-500" /> Verifying PoP Token...
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto py-20">
      <div className="glass-panel p-8 rounded-3xl border border-red-500/20 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Review Restricted</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => router.back()} className="text-blue-400 hover:underline">Go Back</button>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-4">
            <ShieldCheck size={12} /> Verified Purchase Review
          </div>
          <h1 className="text-3xl font-black text-white">Share Your Experience</h1>
          <p className="text-slate-400 mt-2">Your review will be cryptographically anchored to the blockchain.</p>
        </header>

        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex flex-col items-center py-4 border-b border-white/5">
            <label className="text-xs text-slate-500 uppercase font-bold mb-4">Overall Rating</label>
            <StarRatingInput value={rating} onChange={setRating} size={32} />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Review Title</label>
            <input 
              type="text" 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Detailed Feedback</label>
            <textarea 
              required 
              minLength={20}
              rows={5}
              value={content} 
              onChange={e => setContent(e.target.value)}
              placeholder="What did you like or dislike? (Min 20 characters)"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none" 
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : "Publish Verified Review"}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}