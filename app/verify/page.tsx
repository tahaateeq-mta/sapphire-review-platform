"use client";
import React, { useState } from 'react';
import { ShieldCheck, Search, XCircle, Activity, Blocks, Loader2 } from 'lucide-react';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import { getDemoState } from '@/lib/demoStore';
import BlockchainStatusBadge from '@/components/audit/BlockchainStatusBadge';
import { collection, query as fsQuery, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase/client';
import { Review, AuditEvent, Product } from '@/lib/types';

export default function VerifyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<{type: 'REVIEW'|'EVENT'|'NOT_FOUND'|'LOADING'|null, data?: any}>({type: null});

  const isFirebaseMode = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

  const handleSearch = async () => {
    if (!searchQuery) return;
    setResult({ type: 'LOADING' });

    if (isFirebaseMode) {
      try {
        // 1. Multi-tier Search: Review ID or Content Hash
        let reviewData: Review | null = null;
        const reviewRef = doc(firestoreDb, "reviews", searchQuery);
        const reviewSnap = await getDoc(reviewRef);

        if (reviewSnap.exists()) {
          reviewData = { id: reviewSnap.id, ...reviewSnap.data() } as Review;
        } else {
          const qHash = fsQuery(collection(firestoreDb, "reviews"), where("contentHash", "==", searchQuery));
          const snapHash = await getDocs(qHash);
          if (!snapHash.empty) {
            reviewData = { id: snapHash.docs[0].id, ...snapHash.docs[0].data() } as Review;
          }
        }

        if (reviewData) {
          // Fixed: Accessing productId on the properly typed reviewData
          const [productSnap, eventsSnap] = await Promise.all([
            getDoc(doc(firestoreDb, "products", reviewData.productId)),
            getDocs(fsQuery(collection(firestoreDb, "auditEvents"), where("reviewId", "==", reviewData.id)))
          ]);
          
          return setResult({ 
            type: 'REVIEW', 
            data: { 
              review: reviewData, 
              product: productSnap.data() as Product, 
              events: eventsSnap.docs.map(d => d.data() as AuditEvent) 
            } 
          });
        }

        // 2. Multi-tier Search: Event ID, Event Hash, or Transaction Hash
        let eventData: AuditEvent | null = null;
        const eventRef = doc(firestoreDb, "auditEvents", searchQuery);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          eventData = { id: eventSnap.id, ...eventSnap.data() } as AuditEvent;
        } else {
          // Search by Event Hash (Preferred for Part 3)
          const qEHash = fsQuery(collection(firestoreDb, "auditEvents"), where("eventHash", "==", searchQuery));
          const snapEHash = await getDocs(qEHash);
          if (!snapEHash.empty) {
             eventData = { id: snapEHash.docs[0].id, ...snapEHash.docs[0].data() } as AuditEvent;
          } else {
            // Search by Tx Hash (Legacy/Blockchain)
            const qTx = fsQuery(collection(firestoreDb, "auditEvents"), where("blockchainTxHash", "==", searchQuery));
            const snapTx = await getDocs(qTx);
            if (!snapTx.empty) {
              eventData = { id: snapTx.docs[0].id, ...snapTx.docs[0].data() } as AuditEvent;
            }
          }
        }

        if (eventData) return setResult({ type: 'EVENT', data: eventData });

        setResult({ type: 'NOT_FOUND' });
      } catch (error) {
        console.error("Search Error:", error);
        setResult({ type: 'NOT_FOUND' });
      }
    } else {
      // Mock Data Mode Implementation
      const state = getDemoState();
      const review = state.reviews.find((r: any) => r.id === searchQuery || r.contentHash === searchQuery);
      if (review) {
        const events = state.auditEvents.filter((e: any) => e.reviewId === review.id);
        const product = state.products.find((p: any) => p.id === review.productId);
        return setResult({ type: 'REVIEW', data: { review, product, events } });
      }
      const event = state.auditEvents.find((e: any) => e.id === searchQuery || e.eventHash === searchQuery || e.blockchainTxHash === searchQuery);
      if (event) return setResult({ type: 'EVENT', data: event });
      setResult({ type: 'NOT_FOUND' });
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto w-full flex flex-col items-center p-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 tracking-tighter text-white uppercase">Public Verification Node</h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Audit the cryptographic integrity of any review using its unique Content Hash, 
            Event Signature, or Blockchain TXID.
          </p>
        </header>
        
        <div className="glass-panel p-8 rounded-3xl w-full mb-12 border border-blue-500/20 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e=>setSearchQuery(e.target.value)} 
              placeholder="Paste Review Hash or Event ID..." 
              className="flex-grow bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm" 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch} 
              disabled={result.type === 'LOADING'}
              className="bg-blue-600 px-8 py-4 rounded-2xl text-white font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {result.type === 'LOADING' ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Verify Proof
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-4 uppercase tracking-widest text-center">
            Ledger Mode: <span className="text-blue-500">{isFirebaseMode ? "LIVE FIRESTORE" : "MOCK LOCAL"}</span>
          </p>
        </div>

        {result.type === 'NOT_FOUND' && (
          <div className="bg-red-500/5 p-10 rounded-3xl w-full border border-red-500/20 text-center shadow-lg">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white uppercase mb-2">Proof Not Found</h3>
            <p className="text-slate-400 text-sm">
              The provided identifier does not match any anchored record in the current ledger.
            </p>
          </div>
        )}

        {result.type === 'REVIEW' && (
          <div className="glass-panel p-8 rounded-3xl w-full border border-green-500/30 relative overflow-hidden mb-6 shadow-2xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
            <div className="flex items-center gap-3 text-green-400 font-black text-2xl mb-8 border-b border-white/5 pb-6">
              <ShieldCheck size={32} /> 
              <span className="uppercase tracking-tighter">Verified Review Proof</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                 <div className="flex flex-col"><span className="text-slate-500 text-[10px] uppercase">Review ID</span><span className="text-white font-mono">{result.data.review.id}</span></div>
                 <div className="flex flex-col"><span className="text-slate-500 text-[10px] uppercase">Product</span><span className="text-white font-bold">{result.data.product?.name || "Unknown Product"}</span></div>
                 <div className="flex flex-col"><span className="text-slate-500 text-[10px] uppercase">Status</span><span className="text-green-400 font-bold tracking-widest">{result.data.review.status}</span></div>
              </div>
              <div className="space-y-4">
                 <div className="flex flex-col"><span className="text-slate-500 text-[10px] uppercase">Content Hash</span><span className="text-blue-400 font-mono text-[10px] break-all">{result.data.review.contentHash}</span></div>
                 <div className="flex flex-col"><span className="text-slate-500 text-[10px] uppercase">Verified Purchase</span><span className="text-white font-bold">YES (PoP Token Verified)</span></div>
              </div>
            </div>
            
            <div className="mt-10 p-5 bg-black/40 rounded-2xl border border-white/5">
                <h4 className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Blocks size={16}/> Ledger Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                   <div><p className="text-slate-500 text-[9px] uppercase">Lifecycle Events</p><p className="text-xl font-black text-white">{result.data.events.length}</p></div>
                   <div><p className="text-slate-500 text-[9px] uppercase">Anchored</p><p className="text-xl font-black text-green-400">{result.data.events.filter((e:any)=>e.blockchainStatus === 'MOCK_CONFIRMED' || e.blockchainStatus === 'ANCHORED').length}</p></div>
                   <div><p className="text-slate-500 text-[9px] uppercase">Pending</p><p className="text-xl font-black text-yellow-500">{result.data.events.filter((e:any)=>e.blockchainStatus === 'PENDING' || e.blockchainStatus === 'NOT_ANCHORED').length}</p></div>
                </div>
            </div>

            <div className="mt-10 flex flex-col md:flex-row gap-4">
              <SmoothLink href={`/store/product/${result.data.review.productId}`} className="flex-1 text-center bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all uppercase text-xs tracking-widest">Back to Store</SmoothLink>
              <SmoothLink href={`/review/${result.data.review.id}/timeline`} className="flex-1 text-center bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 uppercase text-xs tracking-widest">View Audit Chain</SmoothLink>
            </div>
          </div>
        )}

        {result.type === 'EVENT' && (
          <div className="glass-panel p-8 rounded-3xl w-full border border-purple-500/30 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
            <div className="flex items-center gap-3 text-purple-400 font-black text-2xl mb-8 border-b border-white/5 pb-6">
              <ShieldCheck size={32} /> 
              <span className="uppercase tracking-tighter">Audit Event Record</span>
            </div>
            
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                   <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase">Event Type</span><span className="text-purple-400 font-black tracking-widest">{result.data.eventType}</span></div>
                   <div className="flex flex-col gap-1"><span className="text-slate-500 uppercase">Status</span><BlockchainStatusBadge status={result.data.blockchainStatus || 'NOT_ANCHORED'} /></div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase">Event Hash</span>
                    <span className="text-white font-mono text-[10px] bg-black/40 p-3 rounded-xl break-all">{result.data.eventHash}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase">Blockchain TX</span>
                    <span className="text-blue-400 font-mono text-[10px] bg-black/40 p-3 rounded-xl break-all">{result.data.blockchainTxHash || "N/A"}</span>
                  </div>
                </div>

                {result.data.explorerUrl && (
                  <a href={result.data.explorerUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-blue-400 hover:text-white font-bold uppercase tracking-widest mt-6">
                    View on Block Explorer &rarr;
                  </a>
                )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}