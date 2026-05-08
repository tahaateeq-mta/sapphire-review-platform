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

type AdminDispute = {
  id: string;
  reviewId: string;
  productId?: string;
  merchantId?: string;
  openedBy?: string;
  reason?: string;
  description?: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | string;
  adminDecision?: string;
  adminNoteHash?: string;
  createdAt?: string;
  resolvedAt?: string;
  updatedAt?: string;
};

export default function AdminDashboard() {
  const { userProfile, currentUser } = useAuth() as any;

  const [mounted, setMounted] = useState(false);

  const [state, setState] = useState<any>(null);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [auditStats, setAuditStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    coverage: 0,
  });

  const [decisionDispute, setDecisionDispute] = useState<AdminDispute | null>(
    null
  );
  const [decisionType, setDecisionType] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const isFirebaseMode = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

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
              status: String(data.status || "OPEN"),
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

        const events = eventsSnapshot.docs.map((docSnap) => docSnap.data());

        const confirmed = events.filter(
          (event: any) =>
            event.blockchainStatus === "MOCK_CONFIRMED" ||
            event.blockchainStatus === "CONFIRMED"
        ).length;

        const pending = events.filter(
          (event: any) =>
            event.blockchainStatus === "PENDING" ||
            event.blockchainStatus === "NOT_ANCHORED" ||
            !event.blockchainStatus
        ).length;

        setAuditStats({
          total: events.length,
          confirmed,
          pending,
          coverage:
            events.length > 0 ? Math.round((confirmed / events.length) * 100) : 0,
        });
      } catch (error) {
        console.error("Error loading Firebase data:", error);
      }
    } else {
      const demoState = getDemoState();
      setState(demoState);

      setDisputes(
        demoState.disputes.filter(
          (dispute: any) =>
            dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW"
        )
      );

      const events = demoState.auditEvents;

      const confirmed = events.filter(
        (event: any) =>
          event.blockchainStatus === "MOCK_CONFIRMED" ||
          event.blockchainStatus === "CONFIRMED"
      ).length;

      const pending = events.filter(
        (event: any) =>
          event.blockchainStatus === "PENDING" ||
          event.blockchainStatus === "NOT_ANCHORED" ||
          !event.blockchainStatus
      ).length;

      setAuditStats({
        total: events.length,
        confirmed,
        pending,
        coverage:
          events.length > 0 ? Math.round((confirmed / events.length) * 100) : 0,
      });
    }
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
    } else {
      const newState = { ...state };

      const disputeIndex = newState.disputes.findIndex(
        (dispute: any) => dispute.id === disputeId
      );

      if (disputeIndex === -1) {
        alert("Dispute not found.");
        return;
      }

      const reviewIndex = newState.reviews.findIndex(
        (review: any) => review.id === newState.disputes[disputeIndex].reviewId
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

    if (isFirebaseMode) {
      let newReviewStatus = "ACTIVE";
      let newDisputeStatus = "RESOLVED";

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
      const newState = { ...state };

      const disputeIndex = newState.disputes.findIndex(
        (dispute: any) => dispute.id === disputeId
      );

      const reviewIndex = newState.reviews.findIndex(
        (review: any) => review.id === reviewId
      );

      if (disputeIndex === -1 || reviewIndex === -1) {
        alert("Dispute or review not found.");
        return;
      }

      let newReviewStatus = newState.reviews[reviewIndex].status;
      let newDisputeStatus = "RESOLVED";

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
  };

  if (!mounted) {
    return null;
  }

  return (
    <RequireRole allowedRoles={["ADMIN"]}>
      <PageTransition>
        <div className="w-full max-w-6xl mx-auto p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                Admin Dashboard
              </h1>

              <p className="text-sm text-purple-400 font-mono bg-purple-500/10 inline-block px-3 py-1 rounded-full border border-purple-500/20">
                Logged in as: {userProfile?.name || "Admin"} (
                {userProfile?.email})
              </p>
            </div>

            <div className="flex gap-3">
              <SmoothLink
                href="/admin/merchants"
                className="bg-blue-600/20 text-blue-400 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600/30 transition border border-blue-500/30 flex items-center gap-2"
              >
                <Store size={16} />
                Manage Merchants
              </SmoothLink>

              <SmoothLink
                href="/admin/audit-log"
                className="bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/20 transition border border-white/5"
              >
                View Full Ledger
              </SmoothLink>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl text-center shadow-lg">
              <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">
                Total Events
              </p>
              <p className="text-3xl font-black text-white">
                {auditStats.total}
              </p>
            </div>

            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl text-center shadow-lg">
              <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">
                Confirmed
              </p>
              <p className="text-3xl font-black text-cyan-400">
                {auditStats.confirmed}
              </p>
            </div>

            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl text-center shadow-lg">
              <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">
                Pending Anchor
              </p>
              <p className="text-3xl font-black text-warning">
                {auditStats.pending}
              </p>
            </div>

            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl text-center shadow-lg">
              <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">
                Coverage
              </p>
              <p className="text-3xl font-black text-success">
                {auditStats.coverage}%
              </p>
            </div>
          </div>

          <div className="bg-slate-900 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-black/40 text-slate-400 text-xs uppercase font-semibold">
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
                      className="px-6 py-12 text-center text-slate-500 italic"
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
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {dispute.id || "Missing ID"}
                      </td>

                      <td className="px-6 py-4 text-white font-medium">
                        {dispute.reason || "No reason provided"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${
                            dispute.status === "UNDER_REVIEW"
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                              : "bg-warning/10 border-warning/20 text-warning"
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-x-3">
                        {dispute.status === "OPEN" && (
                          <button
                            onClick={() =>
                              handleMarkUnderReview(
                                dispute.id,
                                dispute.reviewId
                              )
                            }
                            disabled={!dispute.id || !dispute.reviewId}
                            className="text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Mark Under Review
                          </button>
                        )}

                        <button
                          onClick={() => setDecisionDispute(dispute)}
                          disabled={!dispute.id || !dispute.reviewId}
                          className="text-success hover:text-green-400 text-xs font-bold transition-colors bg-success/10 px-3 py-1.5 rounded border border-success/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Make Decision
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {decisionDispute && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <form
                onSubmit={handleDecision}
                className="bg-slate-900 p-8 rounded-3xl w-full max-w-lg border border-purple-500/30 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Admin Decision
                  </h3>

                  <button
                    type="button"
                    onClick={() => setDecisionDispute(null)}
                  >
                    <X className="text-slate-400 hover:text-white" />
                  </button>
                </div>

                <p className="text-xs text-blue-400 mb-4 font-mono bg-blue-900/20 p-2 rounded border border-blue-500/20">
                  Target Dispute: {decisionDispute.id}
                </p>

                <select
                  value={decisionType}
                  onChange={(event) => setDecisionType(event.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500 mb-4 transition-colors"
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500 mb-4 transition-colors"
                />

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-500 transition shadow-lg shadow-purple-500/20"
                >
                  Execute Cryptographic Decision
                </button>
              </form>
            </div>
          )}
        </div>
      </PageTransition>
    </RequireRole>
  );
}