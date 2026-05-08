import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../client";
import { Dispute } from "@/lib/types";
import { createFirestoreAuditEvent } from "./auditService";

export async function openDispute(input: { reviewId: string; merchantUid: string; merchantId: string; reason: string; description: string; }) {
  const disputeId = `disp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  const dispute: Dispute = {
    id: disputeId,
    reviewId: input.reviewId,
    merchantId: input.merchantId,
    openedBy: input.merchantUid,
    reason: input.reason,
    description: input.description,
    status: "OPEN",
    createdAt: new Date().toISOString()
  };

  // Save dispute and update review status
  await setDoc(doc(db, "disputes", disputeId), dispute);
  await updateDoc(doc(db, "reviews", input.reviewId), { 
    status: "DISPUTED", 
    updatedAt: new Date().toISOString() 
  });

  // Log to Audit Trail
  await createFirestoreAuditEvent({
    eventType: "DISPUTE_OPENED",
    reviewId: input.reviewId,
    disputeId,
    actorId: input.merchantUid,
    actorRole: "MERCHANT",
    details: "Merchant opened a dispute for this review.",
    payload: {
      disputeId,
      reviewId: input.reviewId,
      merchantId: input.merchantId,
      reason: input.reason,
    },
    anchorMock: true,
  });

  return dispute;
}