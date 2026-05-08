import React from 'react';
import { CheckCircle, Clock, XCircle, Shield, Link2Off } from "lucide-react";

export default function BlockchainStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "MOCK_CONFIRMED":
      return (
        <span className="flex items-center gap-1 w-fit bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-cyan-500/20">
          <Shield size={12}/> Mock Confirmed
        </span>
      );
    case "CONFIRMED":
    case "ANCHORED":
      return (
        <span className="flex items-center gap-1 w-fit bg-success/10 text-success px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-success/20">
          <CheckCircle size={12}/> Anchored
        </span>
      );
    case "PENDING":
      return (
        <span className="flex items-center gap-1 w-fit bg-warning/10 text-warning px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-warning/20">
          <Clock size={12}/> Pending
        </span>
      );
    case "FAILED":
      return (
        <span className="flex items-center gap-1 w-fit bg-red-500/10 text-red-400 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-red-500/20">
          <XCircle size={12}/> Failed
        </span>
      );
    case "NOT_ANCHORED":
    default:
      return (
        <span className="flex items-center gap-1 w-fit bg-slate-500/10 text-slate-400 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border border-slate-500/20">
          <Link2Off size={12}/> Not Anchored
        </span>
      );
  }
}