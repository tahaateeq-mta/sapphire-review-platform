import PageTransition from "@/components/animations/PageTransition";
import { Server, Database, Globe, Layers, ShieldCheck } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">System Architecture</h1>
        <p className="text-xl text-slate-400 font-light mb-12">Sapphire uses a hybrid architecture. Core application data is handled by the web application backend, while blockchain is used strictly as a tamper-evident audit layer for review lifecycle events.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass-panel p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Globe className="text-blue-400"/> 1. Application Layer (Off-Chain)</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">The Next.js frontend and database handle the heavy lifting. This provides a fast, traditional web2 experience for customers.</p>
            <ul className="text-sm text-slate-500 space-y-2 font-mono"><li>- Full review text</li><li>- User accounts & emails</li><li>- Order data</li><li>- Merchant replies</li></ul>
          </div>
          <div className="glass-panel p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Database className="text-cyan-400"/> 2. IPFS Storage (Off-Chain)</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">Raw review content is hashed and stored on IPFS. This preserves data immutability without paying expensive gas fees.</p>
            <ul className="text-sm text-slate-500 space-y-2 font-mono"><li>- Review content payload</li><li>- IPFS CID generation</li><li>- Decentralized pinning</li></ul>
          </div>
          <div className="glass-panel p-8 rounded-3xl border border-white/5 md:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="text-purple-400"/> 3. Blockchain Audit Layer (On-Chain)</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">Only cryptographic proofs are anchored to the Polygon Amoy testnet. This creates a permanent, tamper-evident timeline of events.</p>
            <div className="flex flex-wrap gap-3 font-mono text-xs">
              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20">Review Content Hash</span>
              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20">Audit Event Hash</span>
              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20">Previous Event Hash</span>
              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20">Storage Reference (CID)</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-6 border-b border-white/10 pb-4">Future Production Deployment</h2>
        <div className="bg-black/40 p-8 rounded-3xl font-mono text-sm text-slate-300 space-y-4 border border-white/5">
          <p>Frontend: <span className="text-white font-bold">Next.js (App Router)</span></p>
          <p>Database: <span className="text-white font-bold">Supabase (PostgreSQL)</span></p>
          <p>Decentralized Storage: <span className="text-white font-bold">Pinata (IPFS)</span></p>
          <p>Blockchain RPC: <span className="text-white font-bold">Alchemy or Infura</span></p>
          <p>Smart Contract Network: <span className="text-white font-bold">Polygon PoS (EVM L2)</span></p>
        </div>
      </div>
    </PageTransition>
  );
}