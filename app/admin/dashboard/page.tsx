"use client";

import React, { useEffect, useState } from "react";
import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import RequireRole from "@/components/auth/RequireRole";
import { useAuth } from "@/components/providers/AuthProvider";
import { getDemoState, saveDemoState } from "@/lib/demoStore";
import { generateHash } from "@/lib/hash";
import { createAuditEvent, getPreviousEventHashForOrder } from "@/lib/audit";
import { Store, X } from "lucide-react";
import { firestoreDb } from "@/lib/firebase/client";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { createFirestoreAuditEvent } from "@/lib/firebase/services/auditService";
import type { UserProfile } from "@/lib/types";

type AuthUser = {
  uid: string;
  email?: string | null;
};

type AuditStats = {
  total: number;
  confirmed: number;
  pending: number;
  coverage: number;
};

type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

type AdminDispute = {
  id: string;
  reviewId: string;
  productId?: string;
  merchantId?: string;
  openedBy?: string;
  reason?: string;
  description?: string;
  status: DisputeStatus;
  adminDecision?: string;
  adminNoteHash?: string;
  createdAt?: string;
  resolvedAt?: string;
  updatedAt?: string;
};

type DemoState = ReturnType<typeof getDemoState>;

type DemoAuditEvent = {
  blockchainStatus?: string;
};

type DemoDispute = AdminDispute;

type DemoReview = {
  id: string;
  orderId: string;
  status: string;
};

export default function AdminDashboard() {
  const { userProfile, currentUser } = useAuth() as {
    userProfile: UserProfile | null;
    currentUser: AuthUser | null;
  };

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<DemoState | null>(null);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    coverage: 0,
  });

  const [decisionDispute, setDecisionDispute] =
    useState<AdminDispute | null>(null);
  const [decisionType, setDecisionType] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isFirebaseMode = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

  const calculateStats = (events: DemoAuditEvent[]) => {
    const confirmed = events.filter(
      (event) =>
        event.blockchainStatus === "MOCK_CONFIRMED" ||
        event.blockchainStatus === "CONFIRMED"
    ).length;

    const pending = events.filter(
      (event) =>
        event.blockchainStatus === "PENDING" ||
        event.blockchainStatus === "NOT_ANCHORED" ||
        !event.blockchainStatus
    ).length;

    return {
      total: events.length,
      confirmed,
      pending,
      coverage:
        events.length > 0 ? Math.round((confirmed / events.length) * 100) : 0,
    };
  };

  const loadData = async () => {
    if (isFirebaseMode) {
      try {
        const disputesQuery = query(
          collection(firestoreDb, "disputes"),
          where("status", "in", ["OPEN", "UNDER_REVIEW"])
        );

        const disputesSnapshot = await getDocs(disputesQuery);

        const liveDisputes: AdminDispute[] = disputesSnapshot.docs.map(
          (docSnap) => {
            const data = docSnap.data();

            return {
              id: docSnap.id,
              reviewId: String(data.reviewId || ""),
              productId: data.productId ? String(data.productId) : undefined,
              merchantId: data.merchantId ? String(data.merchantId) : undefined,
              openedBy: data.openedBy ? String(data.openedBy) : undefined,
              reason: data.reason ? String(data.reason) : "No reason provided",
              description: data.description
                ? String(data.description)
                : undefined,
              status: ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].includes(
                String(data.status)
              )
              ? (String(data.status) as DisputeStatus)
              : "OPEN",
              adminDecision: data.adminDecision
                ? String(data.adminDecision)
                : undefined,
              adminNoteHash: data.adminNoteHash
                ? String(data.adminNoteHash)
                : undefined,
              createdAt: data.createdAt ? String(data.createdAt) : undefined,
              resolvedAt: data.resolvedAt
                ? String(data.resolvedAt)
                : undefined,
              updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
            };
          }
        );

        setDisputes(liveDisputes);

        const eventsSnapshot = await getDocs(
          collection(firestoreDb, "auditEvents")
        );

        const events = eventsSnapshot.docs.map(
          (docSnap) => docSnap.data() as DemoAuditEvent
        );

        setAuditStats(calculateStats(events));
      } catch (error) {
        console.error("Error loading Firebase data:", error);
      }

      return;
    }

    const demoState = getDemoState();
    setState(demoState);

    const activeDisputes = demoState.disputes.filter(
      (dispute: DemoDispute) =>
        dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW"
    );

    setDisputes(activeDisputes);
    setAuditStats(calculateStats(demoState.auditEvents as DemoAuditEvent[]));
  };

  useEffect(() => {
    loadData().then(() => setMounted(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirebaseMode]);

  const handleMarkUnderReview = async (
    disputeId: string,
    reviewId: string
  ) => {
    if (!disputeId || !reviewId) {
      alert("Missing dispute or review ID. Please refresh and try again.");
      return;
    }

    const timestamp = new Date().toISOString();

    try {
      setActionLoading(true);

      if (isFirebaseMode) {
        await updateDoc(doc(firestoreDb, "disputes", disputeId), {
          status: "UNDER_REVIEW",
          updatedAt: timestamp,
        });

        await updateDoc(doc(firestoreDb, "reviews", reviewId), {
          status: "UNDER_REVIEW",
          updatedAt: timestamp,
        });

        await createFirestoreAuditEvent({
          eventType: "DISPUTE_UPDATED",
          reviewId,
          disputeId,
          actorId: currentUser?.uid || "admin",
          actorRole: "ADMIN",
          actorPublicId: userProfile?.publicId || "admin",
          details: "Dispute marked UNDER_REVIEW by admin.",
          payload: {
            disputeId,
            reviewId,
            status: "UNDER_REVIEW",
            updatedAt: timestamp,
          },
          anchorMock: true,
        });

        alert("Dispute marked as under review.");
        await loadData();
        return;
      }

      if (!state) {
        alert("Demo state not loaded.");
        return;
      }

      const newState = { ...state };

      const disputeIndex = newState.disputes.findIndex(
        (dispute: DemoDispute) => dispute.id === disputeId
      );

      if (disputeIndex === -1) {
        alert("Dispute not found.");
        return;
      }

      const reviewIndex = newState.reviews.findIndex(
        (review: DemoReview) =>
          review.id === newState.disputes[disputeIndex].reviewId
      );

      if (reviewIndex === -1) {
        alert("Review not found.");
        return;
      }

      newState.disputes[disputeIndex].status = "UNDER_REVIEW";
      newState.reviews[reviewIndex].status = "UNDER_REVIEW";

      newState.auditEvents.push(
        createAuditEvent({
          eventType: "DISPUTE_UPDATED",
          reviewId: newState.reviews[reviewIndex].id,
          orderId: newState.reviews[reviewIndex].orderId,
          actorId: userProfile?.uid || "admin",
          actorRole: "ADMIN",
          actorPublicId: userProfile?.publicId || "admin",
          payload: {
            disputeId,
            newDisputeStatus: "UNDER_REVIEW",
            newReviewStatus: "UNDER_REVIEW",
          },
          previousEventHash: getPreviousEventHashForOrder(
            newState.reviews[reviewIndex].orderId,
            newState.auditEvents
          ),
        })
      );

      saveDemoState(newState);
      setState(newState);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!decisionDispute) {
      alert("No dispute selected.");
      return;
    }

    if (!decisionType) {
      alert("Decision required.");
      return;
    }

    if (adminNote.trim().length < 10) {
      alert("Note required. Minimum 10 characters.");
      return;
    }

    const disputeId = decisionDispute.id;
    const reviewId = decisionDispute.reviewId;

    if (!disputeId || !reviewId) {
      alert("Missing dispute or review ID. Please refresh and try again.");
      return;
    }

    const timestamp = new Date().toISOString();

    try {
      setActionLoading(true);

      if (isFirebaseMode) {
        let newReviewStatus = "ACTIVE";
        let newDisputeStatus: DisputeStatus = "RESOLVED";

        if (decisionType === "NO_ACTION") {
          newReviewStatus = "ACTIVE";
          newDisputeStatus = "RESOLVED";
        } else if (decisionType === "MARK_RESOLVED") {
          newReviewStatus = "RESOLVED";
          newDisputeStatus = "RESOLVED";
        } else if (decisionType === "STRIKE_REVIEW") {
          newReviewStatus = "STRICKEN";
          newDisputeStatus = "RESOLVED";
        } else if (decisionType === "REJECT_DISPUTE") {
          newReviewStatus = "ACTIVE";
          newDisputeStatus = "REJECTED";
        }

        const noteHash = await generateHash(adminNote.trim());

        await updateDoc(doc(firestoreDb, "disputes", disputeId), {
          status: newDisputeStatus,
          adminDecision: decisionType,
          adminNoteHash: noteHash,
          resolvedAt: timestamp,
          updatedAt: timestamp,
        });

        await updateDoc(doc(firestoreDb, "reviews", reviewId), {
          status: newReviewStatus,
          updatedAt: timestamp,
        });

        await createFirestoreAuditEvent({
          eventType: "ADMIN_DECISION",
          reviewId,
          disputeId,
          actorId: currentUser?.uid || "admin",
          actorRole: "ADMIN",
          actorPublicId: userProfile?.publicId || "admin",
          details: `Admin decision: ${decisionType} applied to dispute.`,
          payload: {
            disputeId,
            reviewId,
            decision: decisionType,
            newReviewStatus,
            newDisputeStatus,
            adminNoteHash: noteHash,
            decidedAt: timestamp,
          },
          anchorMock: true,
        });

        alert("Admin decision securely recorded to Firestore.");
      } else {
        if (!state) {
          alert("Demo state not loaded.");
          return;
        }

        const newState = { ...state };

        const disputeIndex = newState.disputes.findIndex(
          (dispute: DemoDispute) => dispute.id === disputeId
        );

        const reviewIndex = newState.reviews.findIndex(
          (review: DemoReview) => review.id === reviewId
        );

        if (disputeIndex === -1 || reviewIndex === -1) {
          alert("Dispute or review not found.");
          return;
        }

        let newReviewStatus = newState.reviews[reviewIndex].status;
        let newDisputeStatus: DisputeStatus = "RESOLVED";

        if (decisionType === "NO_ACTION") {
          newReviewStatus = "ACTIVE";
          newState.disputes[disputeIndex].adminDecision = "NO_ACTION";
        } else if (decisionType === "MARK_RESOLVED") {
          newReviewStatus = "RESOLVED";
          newState.disputes[disputeIndex].adminDecision = "MARK_RESOLVED";
        } else if (decisionType === "STRIKE_REVIEW") {
          newReviewStatus = "STRICKEN";
          newState.disputes[disputeIndex].adminDecision = "STRIKE_REVIEW";
        } else if (decisionType === "REJECT_DISPUTE") {
          newReviewStatus = "ACTIVE";
          newDisputeStatus = "REJECTED";
          newState.disputes[disputeIndex].adminDecision = "REJECT_DISPUTE";
        }

        const noteHash = await generateHash(adminNote.trim());

        newState.reviews[reviewIndex].status = newReviewStatus;
        newState.disputes[disputeIndex].status = newDisputeStatus;
        newState.disputes[disputeIndex].resolvedAt = timestamp;

        newState.auditEvents.push(
          createAuditEvent({
            eventType: "ADMIN_DECISION",
            reviewId: newState.reviews[reviewIndex].id,
            orderId: newState.reviews[reviewIndex].orderId,
            actorId: userProfile?.uid || "admin",
            actorRole: "ADMIN",
            actorPublicId: userProfile?.publicId || "admin",
            payload: {
              disputeId,
              decision: decisionType,
              adminNoteHash: noteHash,
            },
            previousEventHash: getPreviousEventHashForOrder(
              newState.reviews[reviewIndex].orderId,
              newState.auditEvents
            ),
          })
        );

        saveDemoState(newState);
        setState(newState);
      }

      setDecisionDispute(null);
      setDecisionType("");
      setAdminNote("");
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <RequireRole allowedRoles={["ADMIN"]}>
      <PageTransition>
        <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-0 py-4 sm:py-6">
          <div className="mb-8 flex flex-col justify-between gap-5 md:mb-10 md:flex-row md:items-center">
            <div className="min-w-0">
              <h1 className="mb-2 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="inline-block max-w-full break-all rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 font-mono text-xs leading-5 text-purple-400 sm:break-words sm:text-sm">
                Logged in as: {userProfile?.name || "Admin"} (
                {userProfile?.email || "No email"})
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <SmoothLink
                href="/admin/merchants"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/20 px-5 py-3 text-sm font-bold text-blue-400 transition hover:bg-blue-600/30 sm:w-auto"
              >
                <Store size={16} />
                Manage Merchants
              </SmoothLink>

              <SmoothLink
                href="/admin/audit-log"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/5 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 sm:w-auto"
              >
                View Full Ledger
              </SmoothLink>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-12 lg:grid-cols-4 lg:gap-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg sm:p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Events
              </p>
              <p className="text-3xl font-black text-white">
                {auditStats.total}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg sm:p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Confirmed
              </p>
              <p className="text-3xl font-black text-cyan-400">
                {auditStats.confirmed}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg sm:p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Pending Anchor
              </p>
              <p className="text-3xl font-black text-yellow-400">
                {auditStats.pending}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 text-center shadow-lg sm:p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                Coverage
              </p>
              <p className="text-3xl font-black text-green-400">
                {auditStats.coverage}%
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-white">
                Active Disputes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review, investigate, and resolve disputed review records.
              </p>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm text-slate-300">
                <thead className="bg-black/40 text-xs font-semibold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Dispute ID</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {disputes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center italic text-slate-500"
                      >
                        No active disputes to review.
                      </td>
                    </tr>
                  ) : (
                    disputes.map((dispute, index) => (
                      <tr
                        key={
                          dispute.id ||
                          `${dispute.reviewId || "review"}-${index}`
                        }
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[220px] break-all px-6 py-4 font-mono text-xs text-slate-400">
                          {dispute.id || "Missing ID"}
                        </td>

                        <td className="max-w-[260px] break-words px-6 py-4 font-medium text-white">
                          {dispute.reason || "No reason provided"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider ${
                              dispute.status === "UNDER_REVIEW"
                                ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                                : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {dispute.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            {dispute.status === "OPEN" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkUnderReview(
                                    dispute.id,
                                    dispute.reviewId
                                  )
                                }
                                disabled={
                                  actionLoading ||
                                  !dispute.id ||
                                  !dispute.reviewId
                                }
                                className="text-xs font-bold text-blue-400 transition-colors hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Mark Under Review
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDecisionDispute(dispute)}
                              disabled={
                                actionLoading ||
                                !dispute.id ||
                                !dispute.reviewId
                              }
                              className="rounded border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400 transition-colors hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Make Decision
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {disputes.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-black/20 p-8 text-center italic text-slate-500">
                  No active disputes to review.
                </div>
              ) : (
                disputes.map((dispute, index) => (
                  <div
                    key={
                      dispute.id || `${dispute.reviewId || "review"}-${index}`
                    }
                    className="rounded-2xl border border-white/5 bg-black/20 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider ${
                          dispute.status === "UNDER_REVIEW"
                            ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                            : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {dispute.status}
                      </span>

                      <span className="font-mono text-[10px] text-slate-500">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
                          Dispute ID
                        </p>
                        <p className="break-all font-mono text-xs text-slate-300">
                          {dispute.id || "Missing ID"}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
                          Reason
                        </p>
                        <p className="break-words text-sm font-medium text-white">
                          {dispute.reason || "No reason provided"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        {dispute.status === "OPEN" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkUnderReview(
                                dispute.id,
                                dispute.reviewId
                              )
                            }
                            disabled={
                              actionLoading || !dispute.id || !dispute.reviewId
                            }
                            className="w-full rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs font-bold text-blue-400 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Mark Under Review
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDecisionDispute(dispute)}
                          disabled={
                            actionLoading || !dispute.id || !dispute.reviewId
                          }
                          className="w-full rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs font-bold text-green-400 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Make Decision
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {decisionDispute && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
              <form
                onSubmit={handleDecision}
                className="my-8 w-full max-w-lg rounded-3xl border border-purple-500/30 bg-slate-900 p-5 shadow-2xl sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <h3 className="break-words text-xl font-bold text-white">
                    Admin Decision
                  </h3>

                  <button
                    type="button"
                    onClick={() => setDecisionDispute(null)}
                    className="rounded-lg p-2 transition hover:bg-white/10"
                  >
                    <X className="text-slate-400 hover:text-white" />
                  </button>
                </div>

                <p className="mb-4 break-all rounded border border-blue-500/20 bg-blue-900/20 p-2 font-mono text-xs text-blue-400">
                  Target Dispute: {decisionDispute.id}
                </p>

                <select
                  value={decisionType}
                  onChange={(event) => setDecisionType(event.target.value)}
                  required
                  className="mb-4 w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none transition-colors focus:border-purple-500"
                >
                  <option value="">Select Action...</option>
                  <option value="MARK_RESOLVED">
                    Mark Review as Resolved
                  </option>
                  <option value="STRIKE_REVIEW">
                    Strike Review (Hide Content)
                  </option>
                  <option value="REJECT_DISPUTE">
                    Reject Dispute (Restore Review)
                  </option>
                  <option value="NO_ACTION">
                    No Action (Close Dispute)
                  </option>
                </select>

                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  required
                  minLength={10}
                  placeholder="Required admin justification note..."
                  rows={4}
                  className="mb-4 w-full resize-y rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none transition-colors focus:border-purple-500"
                />

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full rounded-xl bg-purple-600 py-3.5 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading
                    ? "Recording Decision..."
                    : "Execute Cryptographic Decision"}
                </button>
              </form>
            </div>
          )}
        </div>
      </PageTransition>
    </RequireRole>
  );
}