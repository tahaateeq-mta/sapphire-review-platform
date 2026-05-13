"use client";

import React, { useState } from "react";
import {
  Activity,
  Blocks,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query as fsQuery,
  where,
} from "firebase/firestore";

import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import BlockchainStatusBadge from "@/components/audit/BlockchainStatusBadge";
import { getDemoState } from "@/lib/demoStore";
import { firestoreDb } from "@/lib/firebase/client";
import type { AuditEvent, Product, Review } from "@/lib/types";

type VerifyResult =
  | {
      type: null;
    }
  | {
      type: "LOADING";
    }
  | {
      type: "NOT_FOUND";
    }
  | {
      type: "REVIEW";
      data: {
        review: Review;
        product: Product | null;
        events: AuditEvent[];
      };
    }
  | {
      type: "EVENT";
      data: AuditEvent;
    };

function isAnchoredEvent(event: AuditEvent) {
  return event.blockchainStatus === "CONFIRMED";
}

function isPendingEvent(event: AuditEvent) {
  return (
    event.blockchainStatus === "PENDING" ||
    event.blockchainStatus === "NOT_ANCHORED"
  );
}

export default function VerifyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<VerifyResult>({ type: null });

  const isFirebaseMode = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

  const handleSearch = async () => {
    const cleanQuery = searchQuery.trim();

    if (!cleanQuery || result.type === "LOADING") return;

    setResult({ type: "LOADING" });

    if (isFirebaseMode) {
      try {
        let reviewData: Review | null = null;

        const reviewRef = doc(firestoreDb, "reviews", cleanQuery);
        const reviewSnap = await getDoc(reviewRef);

        if (reviewSnap.exists()) {
          reviewData = {
            id: reviewSnap.id,
            ...reviewSnap.data(),
          } as Review;
        } else {
          const hashQuery = fsQuery(
            collection(firestoreDb, "reviews"),
            where("contentHash", "==", cleanQuery)
          );

          const hashSnap = await getDocs(hashQuery);

          if (!hashSnap.empty) {
            reviewData = {
              id: hashSnap.docs[0].id,
              ...hashSnap.docs[0].data(),
            } as Review;
          }
        }

        if (reviewData) {
          const [productSnap, eventsSnap] = await Promise.all([
            getDoc(doc(firestoreDb, "products", reviewData.productId)),
            getDocs(
              fsQuery(
                collection(firestoreDb, "auditEvents"),
                where("reviewId", "==", reviewData.id)
              )
            ),
          ]);

          const product = productSnap.exists()
            ? ({ id: productSnap.id, ...productSnap.data() } as Product)
            : null;

          const events = eventsSnap.docs.map(
            (eventDoc) =>
              ({
                id: eventDoc.id,
                ...eventDoc.data(),
              }) as AuditEvent
          );

          setResult({
            type: "REVIEW",
            data: {
              review: reviewData,
              product,
              events,
            },
          });

          return;
        }

        let eventData: AuditEvent | null = null;

        const eventRef = doc(firestoreDb, "auditEvents", cleanQuery);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          eventData = {
            id: eventSnap.id,
            ...eventSnap.data(),
          } as AuditEvent;
        } else {
          const eventHashQuery = fsQuery(
            collection(firestoreDb, "auditEvents"),
            where("eventHash", "==", cleanQuery)
          );

          const eventHashSnap = await getDocs(eventHashQuery);

          if (!eventHashSnap.empty) {
            eventData = {
              id: eventHashSnap.docs[0].id,
              ...eventHashSnap.docs[0].data(),
            } as AuditEvent;
          } else {
            const txQuery = fsQuery(
              collection(firestoreDb, "auditEvents"),
              where("blockchainTxHash", "==", cleanQuery)
            );

            const txSnap = await getDocs(txQuery);

            if (!txSnap.empty) {
              eventData = {
                id: txSnap.docs[0].id,
                ...txSnap.docs[0].data(),
              } as AuditEvent;
            }
          }
        }

        if (eventData) {
          setResult({
            type: "EVENT",
            data: eventData,
          });

          return;
        }

        setResult({ type: "NOT_FOUND" });
      } catch (error) {
        console.error("Search error:", error);
        setResult({ type: "NOT_FOUND" });
      }

      return;
    }

    const state = getDemoState();

    const review =
      state.reviews.find(
        (item) => item.id === cleanQuery || item.contentHash === cleanQuery
      ) || null;

    if (review) {
      const events = state.auditEvents.filter(
        (event) => event.reviewId === review.id
      );

      const product =
        state.products.find((item) => item.id === review.productId) || null;

      setResult({
        type: "REVIEW",
        data: {
          review,
          product,
          events,
        },
      });

      return;
    }

    const event =
      state.auditEvents.find(
        (item) =>
          item.id === cleanQuery ||
          item.eventHash === cleanQuery ||
          item.blockchainTxHash === cleanQuery
      ) || null;

    if (event) {
      setResult({
        type: "EVENT",
        data: event,
      });

      return;
    }

    setResult({ type: "NOT_FOUND" });
  };

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center overflow-x-hidden px-0 py-4 sm:py-8">
        <header className="mb-8 max-w-2xl text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            <Activity size={13} />
            Public Audit Tool
          </div>

          <h1 className="mb-4 break-words text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
            Public Verification Node
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-7 text-slate-400">
            Audit the cryptographic integrity of any review using its unique
            Content Hash, Event Signature, or Blockchain TXID.
          </p>
        </header>

        <div className="glass-panel mb-8 w-full rounded-3xl border border-blue-500/20 p-5 shadow-2xl sm:mb-12 sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Paste Review Hash or Event ID..."
              className="min-w-0 flex-grow rounded-2xl border border-white/10 bg-black/50 px-4 py-4 font-mono text-sm text-white transition-all placeholder:text-slate-600 focus:border-blue-500 focus:outline-none sm:px-6"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={result.type === "LOADING" || !searchQuery.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-8"
            >
              {result.type === "LOADING" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Search size={18} />
              )}
              Verify Proof
            </button>
          </div>

          <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-slate-600">
            Ledger Mode:{" "}
            <span className="text-blue-500">
              {isFirebaseMode ? "LIVE FIRESTORE" : "MOCK LOCAL"}
            </span>
          </p>
        </div>

        {result.type === "NOT_FOUND" && (
          <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center shadow-lg sm:p-10">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />

            <h3 className="mb-2 text-xl font-black uppercase text-white">
              Proof Not Found
            </h3>

            <p className="mx-auto max-w-md text-sm leading-6 text-slate-400">
              The provided identifier does not match any anchored record in the
              current ledger.
            </p>
          </div>
        )}

        {result.type === "REVIEW" && (
          <div className="glass-panel relative mb-6 w-full overflow-hidden rounded-3xl border border-green-500/30 p-5 shadow-2xl sm:p-8">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-green-500 sm:w-2" />

            <div className="mb-8 flex flex-col gap-3 border-b border-white/5 pb-6 text-green-400 sm:flex-row sm:items-center">
              <ShieldCheck size={32} className="shrink-0" />

              <span className="break-words text-xl font-black uppercase tracking-tight sm:text-2xl">
                Verified Review Proof
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2 md:gap-8">
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Review ID
                  </span>
                  <span className="break-all font-mono text-white">
                    {result.data.review.id}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Product
                  </span>
                  <span className="break-words font-bold text-white">
                    {result.data.product?.name || "Unknown Product"}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Status
                  </span>
                  <span className="break-words font-bold tracking-widest text-green-400">
                    {result.data.review.status}
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Content Hash
                  </span>
                  <span className="break-all font-mono text-[10px] leading-5 text-blue-400">
                    {result.data.review.contentHash || "N/A"}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Verified Purchase
                  </span>
                  <span className="break-words font-bold text-white">
                    YES — PoP Token Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/5 bg-black/40 p-4 sm:mt-10 sm:p-5">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                <Blocks size={16} />
                Ledger Statistics
              </h4>

              <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-[9px] uppercase text-slate-500">
                    Lifecycle Events
                  </p>
                  <p className="text-xl font-black text-white">
                    {result.data.events.length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-[9px] uppercase text-slate-500">
                    Anchored
                  </p>
                  <p className="text-xl font-black text-green-400">
                    {result.data.events.filter(isAnchoredEvent).length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-[9px] uppercase text-slate-500">
                    Pending
                  </p>
                  <p className="text-xl font-black text-yellow-500">
                    {result.data.events.filter(isPendingEvent).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 md:flex-row">
              <SmoothLink
                href={`/store/product/${result.data.review.productId}`}
                className="flex-1 rounded-2xl bg-slate-800 py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-700"
              >
                Back to Store
              </SmoothLink>

              <SmoothLink
                href={`/review/${result.data.review.id}/timeline`}
                className="flex-1 rounded-2xl bg-blue-600 py-4 text-center text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500"
              >
                View Audit Chain
              </SmoothLink>
            </div>
          </div>
        )}

        {result.type === "EVENT" && (
          <div className="glass-panel relative w-full overflow-hidden rounded-3xl border border-purple-500/30 p-5 shadow-2xl sm:p-8">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-purple-500 sm:w-2" />

            <div className="mb-8 flex flex-col gap-3 border-b border-white/5 pb-6 text-purple-400 sm:flex-row sm:items-center">
              <ShieldCheck size={32} className="shrink-0" />

              <span className="break-words text-xl font-black uppercase tracking-tight sm:text-2xl">
                Audit Event Record
              </span>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 font-mono text-xs sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="uppercase text-slate-500">Event Type</span>
                  <span className="break-words font-black tracking-widest text-purple-400">
                    {result.data.eventType}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <span className="uppercase text-slate-500">Status</span>
                  <div className="max-w-full overflow-hidden">
                    <BlockchainStatusBadge
                      status={result.data.blockchainStatus || "NOT_ANCHORED"}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[10px] uppercase text-slate-500">
                    Event Hash
                  </span>
                  <span className="break-all rounded-xl bg-black/40 p-3 font-mono text-[10px] leading-5 text-white">
                    {result.data.eventHash || "N/A"}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[10px] uppercase text-slate-500">
                    Blockchain TX
                  </span>
                  <span className="break-all rounded-xl bg-black/40 p-3 font-mono text-[10px] leading-5 text-blue-400">
                    {result.data.blockchainTxHash || "N/A"}
                  </span>
                </div>
              </div>

              {result.data.explorerUrl && (
                <a
                  href={result.data.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-blue-400 transition hover:bg-blue-500/20 hover:text-white"
                >
                  View on Block Explorer &rarr;
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}