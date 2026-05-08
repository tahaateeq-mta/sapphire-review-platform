"use client";
import React, { useEffect, useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { getDemoState, resetDemoState, anchorAllUnanchoredEvents } from '@/lib/demoStore';
import { getAuditEvents, anchorAllPendingFirestoreAuditEvents } from '@/lib/firebase/services/auditService';
import { AuditEvent } from '@/lib/types';
import BlockchainStatusBadge from '@/components/audit/BlockchainStatusBadge';
import { Link, Download } from 'lucide-react';

export default function AdminAuditLog() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const isFirebaseMode = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

  const loadData = async () => {
    if (isFirebaseMode) {
      try {
        const firestoreEvents = await getAuditEvents();
        setEvents(firestoreEvents);
      } catch (error) { console.error(error); }
    } else {
      setEvents(getDemoState().auditEvents.sort((a: any, b: any) => 
        new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime()
      ));
    }
  };

  useEffect(() => { loadData().then(() => setMounted(true)); }, []);

  const handleAnchorEvents = async () => {
    setIsAnchoring(true);
    if (isFirebaseMode) {
      await anchorAllPendingFirestoreAuditEvents();
      await loadData();
      alert("Events anchored successfully.");
    } else {
      await anchorAllUnanchoredEvents();
      await loadData();
    }
    setIsAnchoring(false);
  };

  const exportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      totalAuditEvents: events.length,
      anchoredEvents: events.filter(e => e.blockchainStatus === 'MOCK_CONFIRMED' || e.blockchainStatus === 'CONFIRMED').length,
      events
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sapphire-audit-report.json`;
    a.click();
  };

  if (!mounted) return <div className="p-10 text-white">LOADING...</div>;

  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto p-8">
        <div className="flex justify-between mb-8">
          <h1 className="text-4xl font-black text-white">Immutable Ledger Log</h1>
          <div className="flex gap-3">
            <button onClick={exportReport} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2">
              <Download size={16}/> Export Report
            </button>
            <button onClick={handleAnchorEvents} disabled={isAnchoring} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl">
              {isAnchoring ? "Processing..." : "Anchor Pending"}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-black/40 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="px-6 py-5">Event / Time</th>
                <th className="px-6 py-5">Actor</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <span className="text-blue-400 font-bold block">{e.eventType}</span>
                    <span className="text-xs text-slate-500">{new Date(e.createdAt || e.timestamp || "").toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 font-mono">{e.actorRole} ({e.actorId.substring(0,8)})</td>
                  <td className="px-6 py-4"><BlockchainStatusBadge status={e.blockchainStatus || 'NOT_ANCHORED'} /></td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {(e.blockchainTxHash || e.transactionHash || "Pending...").substring(0,16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}