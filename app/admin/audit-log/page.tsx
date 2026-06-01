"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageTransition from "@/components/animations/PageTransition";
import RequireRole from "@/components/auth/RequireRole";
import {
  anchorAllUnanchoredEvents,
  getDemoState,
} from "@/lib/demoStore";
import {
  anchorAllPendingFirestoreAuditEvents,
  getAuditEvents,
} from "@/lib/firebase/services/auditService";
import type { AuditEvent } from "@/lib/types";
import BlockchainStatusBadge from "@/components/audit/BlockchainStatusBadge";
import { Download, Link, Loader2, RefreshCw } from "lucide-react";

function getEventDate(event: AuditEvent) {
  return new Date(event.createdAt || event.timestamp || 0);
}

function getEventTimeLabel(event: AuditEvent) {
  const date = getEventDate(event);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

function getShortValue(value?: string | null, length = 16) {
  if (!value) return "Pending...";

  if (value.length <= length) return value;

  return `${value.substring(0, length)}...`;
}

function isAlreadyExistsStatus(status?: string | null) {
  return status === "ALREADY_EXISTS";
}

function isAnchoredStatus(status?: string | null) {
  return (
    status === "MOCK_CONFIRMED" ||
    status === "CONFIRMED" ||
    status === "ALREADY_EXISTS"
  );
}

function getTxHashLabel(event: AuditEvent) {
  if (event.blockchainTxHash || event.transactionHash) {
    return getShortValue(event.blockchainTxHash || event.transactionHash, 22);
  }

  if (isAlreadyExistsStatus(String(event.blockchainStatus))) {
    return "Already on-chain";
  }

  return "Pending...";
}

function getFullTxHashLabel(event: AuditEvent) {
  if (event.blockchainTxHash || event.transactionHash) {
    return event.blockchainTxHash || event.transactionHash;
  }

  if (isAlreadyExistsStatus(String(event.blockchainStatus))) {
    return "Already on-chain, original transaction hash unavailable";
  }

  return "Pending...";
}

export default function AdminAuditLog() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isFirebaseMode = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isFirebaseMode) {
        const firestoreEvents = await getAuditEvents();

        const sortedEvents = [...firestoreEvents].sort(
          (a, b) => getEventDate(b).getTime() - getEventDate(a).getTime()
        );

        setEvents(sortedEvents);
        return;
      }

      const demoEvents = [...getDemoState().auditEvents].sort(
        (a, b) => getEventDate(b).getTime() - getEventDate(a).getTime()
      );

      setEvents(demoEvents);
    } catch (error) {
      console.error("Could not load audit events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [isFirebaseMode]);

  useEffect(() => {
    loadData().then(() => setMounted(true));
  }, [loadData]);

  const auditSummary = useMemo(() => {
    const totalEvents = events.length;

    const anchoredEvents = events.filter((event) =>
      isAnchoredStatus(String(event.blockchainStatus || "NOT_ANCHORED"))
    ).length;

    const pendingEvents = events.filter(
      (event) =>
        event.blockchainStatus === "PENDING" ||
        event.blockchainStatus === "NOT_ANCHORED" ||
        !event.blockchainStatus
    ).length;

    const failedEvents = events.filter(
      (event) => event.blockchainStatus === "FAILED"
    ).length;

    return {
      totalEvents,
      anchoredEvents,
      pendingEvents,
      failedEvents,
    };
  }, [events]);

  const handleAnchorEvents = async () => {
    try {
      setIsAnchoring(true);

      if (isFirebaseMode) {
        await anchorAllPendingFirestoreAuditEvents();
        await loadData();
        alert("Events processed successfully.");
        return;
      }

      await anchorAllUnanchoredEvents();
      await loadData();
      alert("Demo events anchored successfully.");
    } catch (error) {
      console.error("Could not anchor events:", error);
      alert("Could not anchor pending events. Please check the console.");
    } finally {
      setIsAnchoring(false);
    }
  };

  const exportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      mode: isFirebaseMode ? "FIRESTORE" : "DEMO_LOCAL",
      totalAuditEvents: auditSummary.totalEvents,
      anchoredEvents: auditSummary.anchoredEvents,
      pendingEvents: auditSummary.pendingEvents,
      failedEvents: auditSummary.failedEvents,
      events,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "sapphire-audit-report.json";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  if (!mounted || isLoading) {
    return (
      <RequireRole allowedRoles={["ADMIN"]}>
        <PageTransition>
          <div className="flex min-h-[45vh] items-center justify-center px-4 text-center text-white">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-2xl sm:px-10">
              <Loader2
                className="mx-auto mb-4 animate-spin text-blue-500"
                size={36}
              />

              <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
                Loading Audit Ledger...
              </p>
            </div>
          </div>
        </PageTransition>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowedRoles={["ADMIN"]}>
      <PageTransition>
        <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-0 py-4 sm:py-6">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                Immutable Ledger Log
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Review every lifecycle event, blockchain anchor status, and
                transaction reference recorded by the Sapphire audit system.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={exportReport}
                disabled={events.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Download size={16} />
                Export Report
              </button>

              <button
                type="button"
                onClick={handleAnchorEvents}
                disabled={isAnchoring}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isAnchoring ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Anchor Pending
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Events
              </p>
              <p className="text-3xl font-black text-white">
                {auditSummary.totalEvents}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Anchored
              </p>
              <p className="text-3xl font-black text-green-400">
                {auditSummary.anchoredEvents}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Pending
              </p>
              <p className="text-3xl font-black text-yellow-400">
                {auditSummary.pendingEvents}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Failed
              </p>
              <p className="text-3xl font-black text-red-400">
                {auditSummary.failedEvents}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-white">
                Ledger Event Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Mode:{" "}
                <span className="font-mono text-blue-400">
                  {isFirebaseMode ? "LIVE FIRESTORE" : "MOCK LOCAL"}
                </span>
              </p>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1080px] text-left text-sm text-slate-300">
                <thead className="bg-black/40 text-xs font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-5">Event / Time</th>
                    <th className="px-6 py-5">Actor</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Tx Hash</th>
                    <th className="px-6 py-5">Event Hash</th>
                    <th className="px-6 py-5">Explorer</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {events.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center italic text-slate-500"
                      >
                        No audit events found.
                      </td>
                    </tr>
                  ) : (
                    events.map((event, index) => (
                      <tr
                        key={event.id || `${event.eventType}-${index}`}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <span className="block break-words font-bold text-blue-400">
                            {event.eventType}
                          </span>

                          <span className="text-xs text-slate-500">
                            {getEventTimeLabel(event)}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs">
                          <span className="block break-words text-slate-300">
                            {event.actorRole || "UNKNOWN"}
                          </span>

                          <span className="block break-all text-slate-500">
                            {getShortValue(event.actorId, 12)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <BlockchainStatusBadge
                            status={event.blockchainStatus || "NOT_ANCHORED"}
                          />
                        </td>

                        <td className="max-w-[180px] break-all px-6 py-4 font-mono text-xs text-slate-400">
                          {event.explorerUrl ? (
                            <a
                              href={event.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="transition hover:text-blue-400 hover:underline"
                              title={getFullTxHashLabel(event)}
                            >
                              {getTxHashLabel(event)}
                            </a>
                          ) : (
                            getTxHashLabel(event)
                          )}
                        </td>

                        <td className="max-w-[180px] break-all px-6 py-4 font-mono text-xs text-slate-500">
                          {getShortValue(event.eventHash, 22)}
                        </td>

                        <td className="px-6 py-4">
                          {event.explorerUrl ? (
                            <a
                              href={event.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-400 transition hover:bg-blue-500/20 hover:text-white"
                            >
                              <Link size={14} />
                              View
                            </a>
                          ) : isAlreadyExistsStatus(
                              String(event.blockchainStatus)
                            ) ? (
                            <span className="text-xs italic text-blue-400">
                              Already on-chain
                            </span>
                          ) : (
                            <span className="text-xs italic text-slate-600">
                              Unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {events.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-black/20 p-8 text-center italic text-slate-500">
                  No audit events found.
                </div>
              ) : (
                events.map((event, index) => (
                  <article
                    key={event.id || `${event.eventType}-${index}`}
                    className="min-w-0 rounded-2xl border border-white/5 bg-black/20 p-4"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-black uppercase tracking-wide text-blue-400">
                          {event.eventType}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {getEventTimeLabel(event)}
                        </p>
                      </div>

                      <BlockchainStatusBadge
                        status={event.blockchainStatus || "NOT_ANCHORED"}
                      />
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <p className="mb-1 uppercase tracking-widest text-slate-500">
                          Actor
                        </p>

                        <p className="break-words font-mono text-slate-300">
                          {event.actorRole || "UNKNOWN"}{" "}
                          <span className="break-all text-slate-500">
                            ({getShortValue(event.actorId, 12)})
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 uppercase tracking-widest text-slate-500">
                          TX Hash
                        </p>

                        <p className="break-all rounded-xl bg-black/30 p-3 font-mono text-slate-400">
                          {getFullTxHashLabel(event)}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 uppercase tracking-widest text-slate-500">
                          Event Hash
                        </p>

                        <p className="break-all rounded-xl bg-black/30 p-3 font-mono text-slate-500">
                          {event.eventHash || "N/A"}
                        </p>
                      </div>

                      {event.explorerUrl && (
                        <a
                          href={event.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-blue-400 transition hover:bg-blue-500/20 hover:text-white"
                        >
                          <Link size={14} />
                          View Explorer
                        </a>
                      )}

                      {!event.explorerUrl &&
                        isAlreadyExistsStatus(
                          String(event.blockchainStatus)
                        ) && (
                          <p className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center text-xs font-bold uppercase tracking-widest text-blue-400">
                            Already on-chain, explorer transaction unavailable
                          </p>
                        )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </RequireRole>
  );
}