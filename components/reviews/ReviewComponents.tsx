import { Review } from '@/lib/types';
import { Star, ShieldCheck, Clock } from 'lucide-react';
import SmoothLink from '../animations/SmoothLink';

export default function ReviewCard({ review, reviewerPublicId }: { review: Review, reviewerPublicId: string }) {
  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-white/5">
      <div className="flex justify-between items-start">
        <div className="flex gap-1 text-blue-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={18} fill={star <= review.rating ? "currentColor" : "none"} className={star <= review.rating ? "text-blue-400" : "text-slate-600"} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
          <ShieldCheck size={14} /> Verified Purchase
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white tracking-tight">{review.title}</h3>
      <p className="text-slate-300 font-light leading-relaxed">{review.content}</p>
      
      <div className="border-t border-white/5 pt-4 mt-2 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-white/5 px-2 py-1 rounded font-mono text-slate-400">{reviewerPublicId}</span>
          <span className="flex items-center gap-1"><Clock size={12}/> {new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <SmoothLink href={`/verify`} className="flex-1 md:flex-none text-center bg-slate-800 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-700 transition">
            Verify
          </SmoothLink>
          <SmoothLink href={`/review/${review.id}/timeline`} className="flex-1 md:flex-none text-center bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-600/30 transition">
            Timeline
          </SmoothLink>
        </div>
      </div>
    </div>
  );
}