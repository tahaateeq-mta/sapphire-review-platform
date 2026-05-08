"use client";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function HashDisplay({ hash, label, color = "cyan" }: { hash?: string; label?: string; color?: "cyan" | "blue" | "slate" | "success" | "purple" }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return <span className="text-slate-600 italic">N/A</span>;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortHash = hash.length > 15 ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}` : hash;

  const colorStyles = {
    cyan: "text-cyan-400 bg-cyan-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    slate: "text-slate-300 bg-white/10",
    success: "text-success bg-success/10",
    purple: "text-purple-400 bg-purple-500/10"
  };

  return (
    <div className="flex items-center gap-2 inline-flex" title={hash}>
      {label && <span className="text-slate-500 font-bold text-xs uppercase">{label}</span>}
      <span className={`font-mono px-2 py-0.5 rounded text-xs truncate ${colorStyles[color]}`}>{shortHash}</span>
      <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors focus:outline-none" aria-label="Copy hash">
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </button>
    </div>
  );
}