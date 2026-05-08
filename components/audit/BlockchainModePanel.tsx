"use client";
import { Database, Link as LinkIcon, ShieldAlert } from "lucide-react";

export default function BlockchainModePanel() {
  const mode = process.env.NEXT_PUBLIC_BLOCKCHAIN_MODE || "mock";
  const isAmoy = mode === "amoy";

  return (
    <div className={`p-6 rounded-2xl border mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isAmoy ? 'bg-purple-500/10 border-purple-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
      <div>
        <h3 className={`text-lg font-black flex items-center gap-2 mb-2 ${isAmoy ? 'text-purple-400' : 'text-cyan-400'}`}>
          <Database size={18} /> {isAmoy ? 'Live Amoy Anchoring Mode' : 'Mock Blockchain Mode'}
        </h3>
        <p className="text-slate-300 text-sm font-light leading-relaxed max-w-2xl">
          {isAmoy 
            ? "The app is configured for live Polygon Amoy anchoring. Audit events will be sent to the deployed ReviewAuditRegistry smart contract through a secure server-side wallet."
            : "The app is running in mock blockchain mode. This is recommended for FYP demonstration because it reliably simulates transactions without requiring test tokens or live RPC nodes."}
        </p>
      </div>

      <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-slate-400 w-full md:w-auto shrink-0">
        <div className="flex justify-between gap-4 mb-2"><span className="font-bold text-slate-500">Network:</span> <span className="text-white">Polygon Amoy Testnet</span></div>
        <div className="flex justify-between gap-4 mb-2"><span className="font-bold text-slate-500">Chain ID:</span> <span className="text-white">80002</span></div>
        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Contract:</span> <span className="text-white">{process.env.NEXT_PUBLIC_REVIEW_AUDIT_CONTRACT_ADDRESS ? "Connected" : "N/A"}</span></div>
      </div>
    </div>
  );
}