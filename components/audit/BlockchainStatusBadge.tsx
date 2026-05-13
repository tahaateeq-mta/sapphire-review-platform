import React from "react";
import { CheckCircle, Clock, Link2Off, Shield, XCircle } from "lucide-react";

type BlockchainStatus =
  | "NOT_ANCHORED"
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "MOCK_CONFIRMED"
  | undefined
  | null;

export default function BlockchainStatusBadge({
  status,
}: {
  status?: BlockchainStatus;
}) {
  switch (status) {
    case "MOCK_CONFIRMED":
      return (
        <span className="inline-flex w-fit max-w-full items-center gap-1 rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
          <Shield size={12} className="shrink-0" />
          <span className="truncate">Mock Confirmed</span>
        </span>
      );

    case "CONFIRMED":
      return (
        <span className="inline-flex w-fit max-w-full items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
          <CheckCircle size={12} className="shrink-0" />
          <span className="truncate">Anchored</span>
        </span>
      );

    case "PENDING":
      return (
        <span className="inline-flex w-fit max-w-full items-center gap-1 rounded border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
          <Clock size={12} className="shrink-0" />
          <span className="truncate">Pending</span>
        </span>
      );

    case "FAILED":
      return (
        <span className="inline-flex w-fit max-w-full items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
          <XCircle size={12} className="shrink-0" />
          <span className="truncate">Failed</span>
        </span>
      );

    case "NOT_ANCHORED":
    default:
      return (
        <span className="inline-flex w-fit max-w-full items-center gap-1 rounded border border-slate-500/20 bg-slate-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Link2Off size={12} className="shrink-0" />
          <span className="truncate">Not Anchored</span>
        </span>
      );
  }
}