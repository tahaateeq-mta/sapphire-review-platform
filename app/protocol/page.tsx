import PageTransition from "@/components/animations/PageTransition";
import { CheckCircle, ShieldCheck } from "lucide-react";

export default function ProtocolPage() {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">PoVE Protocol</h1>
        <p className="text-xl text-blue-400 font-bold tracking-widest uppercase mb-12">Proof of Verified Experience</p>

        <div className="glass-panel p-8 rounded-3xl mb-12 border border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">What is PoVE?</h2>
          <p className="text-slate-300 font-light leading-relaxed">
            Proof of Verified Experience means a review is only accepted when the reviewer can prove they had a real interaction with the product or service, such as a delivered purchase. In Sapphire, this is demonstrated through one-time Proof-of-Purchase tokens and tamper-evident review lifecycle events.
          </p>
        </div>

        <h2 className="text-2xl font-black text-white mb-6">Why Reviews Are Not Simply Permanent</h2>
        <p className="text-slate-400 font-light leading-relaxed mb-8">
          A permanent negative review can be unfair if a merchant later fixes the issue. Sapphire does not freeze reviews as unchangeable public damage. Instead, it preserves the history while allowing reviews to be resolved, withdrawn, stricken, or updated through transparent lifecycle events.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {['ACTIVE', 'EDITED', 'MERCHANT_RESPONDED', 'DISPUTED', 'UNDER_REVIEW', 'RESOLVED', 'STRICKEN', 'WITHDRAWN', 'ARCHIVED'].map(status => (
            <div key={status} className="bg-white/5 p-4 rounded-xl flex items-center justify-center text-sm font-bold text-white border border-white/5">
              {status}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-black text-white mb-6">What Makes It Tamper-Evident?</h2>
        <ul className="space-y-4 text-slate-300 font-light">
          <li className="flex items-center gap-3"><CheckCircle className="text-success" size={20}/> Content Hashing prevents stealth edits.</li>
          <li className="flex items-center gap-3"><CheckCircle className="text-success" size={20}/> Previous Event Hash Linking creates an unbreakable chain.</li>
          <li className="flex items-center gap-3"><CheckCircle className="text-success" size={20}/> Blockchain Anchoring proves existence at a point in time.</li>
          <li className="flex items-center gap-3"><CheckCircle className="text-success" size={20}/> Public Verification allows anyone to audit the math.</li>
        </ul>
      </div>
    </PageTransition>
  );
}