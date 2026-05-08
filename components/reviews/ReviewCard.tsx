"use client";
import { useState } from 'react';
// Integrated the repaired types from lib/types.ts[cite: 1]
import { Review, MerchantReply, AuditEvent, ReviewStatus } from '@/lib/types';
import { 
  Star, ShieldCheck, Clock, AlertTriangle, CheckCircle, 
  Store, XCircle, ChevronDown, ChevronUp, Database 
} from 'lucide-react';
import SmoothLink from '../animations/SmoothLink';
import BlockchainStatusBadge from '../audit/BlockchainStatusBadge';
import HashDisplay from '../ui/HashDisplay';

export default function ReviewCard({ 
  review, 
  reviewerPublicId, 
  reply, 
  latestEvent 
}: { 
  review: Review, 
  reviewerPublicId: string, 
  reply?: MerchantReply, 
  latestEvent?: AuditEvent 
}) {
  const [showProof, setShowProof] = useState(false);

  // Requirement: Finalized/Hidden statuses must render a sanitized "Stricken" view
  const isHiddenStatus = ['STRICKEN', 'WITHDRAWN', 'ARCHIVED'].includes(review.status);

  if (isHiddenStatus) {
    return (
      <div className={`glass-panel p-6 rounded-3xl flex flex-col gap-4 shadow-xl ${
        review.status === 'STRICKEN' ? 'border-red-500/20 bg-red-500/5' : 'border-slate-600/30 opacity-60'
      }`}>
        <div className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs ${
          review.status === 'STRICKEN' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {review.status === 'STRICKEN' ? <XCircle size={18} /> : <Clock size={18} />} 
          Review {review.status.toLowerCase()}
        </div>
        <p className="text-slate-400 italic text-sm font-light">
          This record was {review.status.toLowerCase()} due to a governance decision or customer request. 
          The cryptographic hash-chain persists for audit integrity.[cite: 3, 19]
        </p>
        <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
            NODE_ID: {review.id.substring(0, 12)}...
          </span>
          <SmoothLink 
            href={`/review/${review.id}/timeline`} 
            className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 transition-all border border-white/5"
          >
            Audit Timeline
          </SmoothLink>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-white/5 relative bg-[#0a1220]/50 backdrop-blur-md shadow-2xl">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-1 text-blue-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              size={18} 
              fill={star <= review.rating ? "currentColor" : "none"} 
              className={star <= review.rating ? "text-blue-400" : "text-slate-700"} 
            />
          ))}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {review.status === 'RESOLVED' && (
            <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
              <CheckCircle size={12}/> Resolved
            </span>
          )}
          {(review.status === 'DISPUTED' || review.status === 'UNDER_REVIEW') && (
            <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
              <AlertTriangle size={12}/> Under Dispute
            </span>
          )}
          <div className="flex items-center gap-1.5 bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/20">
            <ShieldCheck size={14} /> Verified Proof
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-black text-white tracking-tight uppercase">{review.title}</h3>
      <p className="text-slate-400 font-light leading-relaxed text-sm">{review.content}</p>
      
      {reply && (
        <div className="mt-4 p-5 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
          <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-widest mb-3">
            <Store size={14} /> Official Merchant Response
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">{reply.content}</p>
        </div>
      )}

      {/* Protocol Section: Cryptographic Storage & Blockchain Anchoring[cite: 3, 19] */}
      <div className="mt-6 border border-white/5 bg-black/30 rounded-2xl overflow-hidden shadow-inner">
        <button 
          onClick={() => setShowProof(!showProof)} 
          className="w-full flex items-center justify-between p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-blue-400/70">
              <Database size={14}/> {review.storageMode || 'Storage Proof'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-2">
              <ShieldCheck size={14}/> Ledger: {latestEvent?.blockchainStatus || 'Pending'}
            </span>
          </div>
          {showProof ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        
        {showProof && (
          <div className="p-5 border-t border-white/5 bg-black/50 space-y-4 font-mono text-[10px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="text-slate-600 font-black uppercase">Content SIG (SHA-256)</span>
              <HashDisplay hash={review.contentHash} color="cyan" />
            </div>
            {review.ipfsCid && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-slate-600 font-black uppercase">IPFS CID</span>
                <HashDisplay hash={review.ipfsCid} color="slate" />
              </div>
            )}
            {latestEvent && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-slate-600 font-black uppercase">Blockchain Anchor</span>
                {/* Fallback logic to support both transactionHash and blockchainTxHash field names */}
                <HashDisplay 
                  hash={latestEvent.blockchainTxHash || latestEvent.transactionHash || (latestEvent as any).blockchainTx} 
                  color="success" 
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="border-t border-white/5 pt-6 mt-2 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
          <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-400">
            {reviewerPublicId}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12}/> {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <SmoothLink 
            href={`/verify`} 
            className="flex-1 md:flex-none text-center bg-slate-800 text-slate-300 px-5 py-2 rounded-xl hover:bg-slate-700 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
          >
            Verify Proof
          </SmoothLink>
          <SmoothLink 
            href={`/review/${review.id}/timeline`} 
            className="flex-1 md:flex-none text-center bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/30"
          >
            Audit Chain
          </SmoothLink>
        </div>
      </div>
    </div>
  );
}