"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase/client";
import { AuditEvent, Review } from "@/lib/types";
import {
  Loader2,
  ShieldCheck,
  Link as LinkIcon,
  Box,
  ArrowDown,
  AlertCircle,
} from "lucide-react";

function getEventTime(event: AuditEvent): number {
  return new Date(event.createdAt || event.timestamp || 0).getTime();
}

function getEventDetails(event: AuditEvent): string {
  if (typeof event.details === "string") {
    return event.details;
  }

  if (event.details) {
    try {
      return JSON.stringify(event.details);
    } catch {
      return "Lifecycle action recorded.";
    }
  }

  return "Lifecycle action recorded.";
}

function getBlockchainStatusLabel(event: AuditEvent): string {
  return event.blockchainStatus || "NOT_ANCHORED";
}

function isMockOrRealConfirmed(event: AuditEvent): boolean {
  return (
    event.blockchainStatus === "MOCK_CONFIRMED" ||
    event.blockchainStatus === "CONFIRMED"
  );
}

export default function ReviewTimelinePage() {
  const params = useParams();
  const router = useRouter();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTimeline() {
      const reviewId = params.reviewId as string;

      if (!reviewId) {
        setLoading(false);
        setError("Missing review ID.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        if (process.env.NEXT_PUBLIC_DATA_MODE === "firebase") {
          const reviewRef = doc(firestoreDb, "reviews", reviewId);
          const reviewSnapshot = await getDoc(reviewRef);

          if (reviewSnapshot.exists()) {
            setReview({
              id: reviewSnapshot.id,
              ...reviewSnapshot.data(),
            } as Review);
          } else {
            setReview(null);
          }

          const auditQuery = query(
            collection(firestoreDb, "auditEvents"),
            where("reviewId", "==", reviewId)
          );

          const auditSnapshot = await getDocs(auditQuery);

          const loadedEvents = auditSnapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as AuditEvent[];

          const sortedEvents = loadedEvents.sort((a, b) => {
            return getEventTime(a) - getEventTime(b);
          });

          setEvents(sortedEvents);
        }
      } catch (err) {
        console.error("Timeline error:", err);
        setError(
          "Could not load the review timeline. Please check Firestore permissions or try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTimeline();
  }, [params.reviewId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="font-mono text-sm tracking-widest text-slate-500 uppercase">
          Verifying Ledger Integrity...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-white max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white mb-8 font-bold flex items-center gap-2 transition-colors"
        >
          &larr; Back to Platform
        </button>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <AlertCircle size={42} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">
            Timeline Error
          </h1>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  const confirmedEventsCount = events.filter(isMockOrRealConfirmed).length;
  const latestEvent = events.length ? events[events.length - 1] : null;

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-slate-400 hover:text-white mb-8 font-bold flex items-center gap-2 transition-colors"
      >
        &larr; Back to Platform
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black mb-3 tracking-tighter uppercase">
          Review Audit Timeline
        </h1>

        <div className="bg-blue-600/10 border-l-4 border-blue-500 p-4 rounded-r-xl">
          <p className="text-slate-300 text-sm leading-relaxed">
            This timeline provides <strong>tamper-evident proof</strong> of the
            review lifecycle. Each event is linked by hashes. In this prototype,
            blockchain anchoring uses mock Polygon Amoy metadata unless real
            Amoy mode is configured.
          </p>
        </div>
      </div>

      {review && (
        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 mb-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
            <ShieldCheck size={24} />
            <h2 className="font-black text-lg uppercase tracking-tight">
              Review Proof Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">Review ID</span>
              <span className="text-white truncate">{review.id}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">Content Hash</span>
              <span className="text-blue-400 truncate">
                {review.contentHash || "Not available"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">Status</span>
              <span className="text-white bg-slate-800 px-2 py-0.5 rounded self-start">
                {review.status}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">Storage Reference</span>
              <span className="text-slate-300 truncate">
                {review.storageReference ||
                  review.ipfsCid ||
                  "No storage reference"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">
                Lifecycle Events
              </span>
              <span className="text-white">{events.length}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">
                Anchored / Mock Confirmed
              </span>
              <span className="text-green-400 font-bold">
                {confirmedEventsCount}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">Latest Event Hash</span>
              <span className="text-slate-300 truncate">
                {latestEvent?.eventHash || "Legacy event / not available"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase">Latest Tx Hash</span>
              <span className="text-slate-300 truncate">
                {latestEvent?.blockchainTxHash ||
                  latestEvent?.transactionHash ||
                  "Not anchored"}
              </span>
            </div>
          </div>
        </div>
      )}

      {!review && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-10">
          <p className="text-yellow-300 font-bold">Review not found.</p>
          <p className="text-slate-400 text-sm mt-1">
            The audit events may still appear below if legacy records exist.
          </p>
        </div>
      )}

      <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-white/5">
        {events.length === 0 ? (
          <div className="text-center text-slate-500 italic py-20 bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
            No audit events found for this review.
          </div>
        ) : (
          events.map((event) => {
            const txHash = event.blockchainTxHash || event.transactionHash;
            const statusLabel = getBlockchainStatusLabel(event);
            const confirmed = isMockOrRealConfirmed(event);

            return (
              <div
                key={event.id}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-black bg-slate-800 text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Box size={18} />
                </div>

                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-6 rounded-2xl border border-white/5 shadow-xl hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="font-black text-blue-400 text-xs uppercase tracking-widest">
                        {event.eventType}
                      </span>

                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {new Date(
                          event.createdAt || event.timestamp || 0
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                        confirmed
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {statusLabel}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      &quot;{getEventDetails(event)}&quot;
                    </p>

                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                          <LinkIcon size={10} />
                          Payload Hash
                        </span>

                        <span className="text-[10px] text-slate-300 font-mono bg-black/40 p-2 rounded truncate">
                          {event.payloadHash || "Not available"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                          <LinkIcon size={10} />
                          Event Hash
                        </span>

                        <span className="text-[10px] text-slate-300 font-mono bg-black/40 p-2 rounded truncate">
                          {event.eventHash || "Legacy event — no event hash"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                          <ArrowDown size={10} />
                          Previous Event Hash
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono bg-black/40 p-2 rounded truncate italic">
                          {event.previousEventHash || "Genesis Block"}
                        </span>
                      </div>
                    </div>

                    {txHash && (
                      <a
                        href={event.explorerUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-4 text-[10px] text-blue-400 hover:text-white transition-colors underline font-mono"
                      >
                        TX: {txHash.substring(0, 24)}...
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}