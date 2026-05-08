import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';

export default function Home() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center text-center overflow-hidden w-full">
        <div className="animate-fade-in-up glass-panel px-4 py-1.5 rounded-full mb-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Phase 7 FYP Prototype</span>
        </div>

        <h1 className="animate-fade-in-up delay-100 text-6xl md:text-8xl font-black mb-6 tracking-tighter text-white">
          Trust, but <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Verify.</span>
        </h1>
        
        <p className="animate-fade-in-up delay-200 text-xl md:text-2xl text-slate-400 mb-12 font-light max-w-3xl leading-relaxed tracking-tight">
          Sapphire is a tamper-resistant review integrity prototype. It combines verified purchase eligibility, off-chain review storage, hash-linked lifecycle events, and blockchain audit anchoring.
        </p>
        
        <div className="animate-fade-in-up delay-300 flex flex-wrap justify-center gap-4 mb-16 w-full">
          <SmoothLink href="/store" className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]">Start Demo Store</SmoothLink>
          <SmoothLink href="/demo-flow" className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">View Walkthrough</SmoothLink>
          <SmoothLink href="/architecture" className="bg-slate-800/80 text-white border border-white/10 px-8 py-4 rounded-full font-medium hover:bg-slate-700 transition-colors">Architecture</SmoothLink>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm p-4 rounded-xl max-w-3xl mx-auto mb-20 animate-fade-in-up delay-300">
          <strong>Note for Assessors:</strong> This prototype runs entirely in the browser using <code>localStorage</code>, Mock IPFS, and Mock Polygon Amoy Blockchain anchoring to allow for seamless demonstration without real web3 wallets.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto text-left mb-16">
          <div className="glass-panel p-8 rounded-3xl">
             <h3 className="text-xl font-bold text-white mb-4">1. Verified Experience</h3>
             <p className="text-slate-400 font-light leading-relaxed text-sm">Customers cannot leave reviews without a cryptographically consumed Proof-of-Purchase (PoP) token generated upon delivery.</p>
          </div>
          <div className="glass-panel p-8 rounded-3xl">
             <h3 className="text-xl font-bold text-white mb-4">2. Tamper-Evident Ledger</h3>
             <p className="text-slate-400 font-light leading-relaxed text-sm">Sapphire doesn't force reviews to be permanently negative. It allows dispute resolution, but forces every edit, reply, or admin strike onto a public timeline.</p>
          </div>
          <div className="glass-panel p-8 rounded-3xl">
             <h3 className="text-xl font-bold text-white mb-4">3. Blockchain Anchoring</h3>
             <p className="text-slate-400 font-light leading-relaxed text-sm">Heavy review text is stored off-chain (IPFS). Only lightweight cryptographic proofs are anchored to the Polygon Amoy testnet.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}