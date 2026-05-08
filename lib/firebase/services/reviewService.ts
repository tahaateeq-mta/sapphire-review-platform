import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { firestoreDb } from "../client";
import { Review } from "../../types";
// Fixed: Updated to match the new export in auditService.ts
import { createFirestoreAuditEvent } from "./auditService";
import { consumePoPToken } from "./popTokenService";

/**
 * Fetches all reviews associated with a specific Product ID.
 */
export async function getReviewsForProduct(productId: string): Promise<Review[]> {
  const q = query(collection(firestoreDb, "reviews"), where("productId", "==", productId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}

/**
 * Retrieves a single review by its unique Firestore ID.
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  const docRef = doc(firestoreDb, "reviews", reviewId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } as Review : null;
}

/**
 * Retrieves a review associated with a specific Order ID.
 */
export async function getReviewForOrder(orderId: string): Promise<Review | null> {
  const q = query(collection(firestoreDb, "reviews"), where("orderId", "==", orderId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Review;
}

/**
 * Fetches all reviews submitted by a specific Customer (User ID).
 */
export async function getReviewsForCustomer(userId: string): Promise<Review[]> {
  const q = query(collection(firestoreDb, "reviews"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}

/**
 * Fetches all reviews assigned to a specific Merchant ID.
 */
export async function getReviewsForMerchant(merchantId: string): Promise<Review[]> {
  const q = query(collection(firestoreDb, "reviews"), where("merchantId", "==", merchantId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}

/**
 * Submits a new verified review, consumes the PoP token, and logs the audit event.
 */
export async function submitVerifiedReview(input: {
  orderId: string;
  productId: string;
  userId: string;
  merchantId: string;
  tokenId: string;
  rating: number;
  title: string;
  content: string;
}): Promise<void> {
  const reviewRef = doc(collection(firestoreDb, "reviews"));
  const now = new Date().toISOString();

  const newReview: Review = {
    id: reviewRef.id,
    ...input,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    contentHash: "pending_hash", 
  };

  try {
    await Promise.all([
      setDoc(reviewRef, newReview),
      consumePoPToken(input.tokenId)
    ]);

    // Fixed: Updated to createFirestoreAuditEvent with linked IDs for hashing chain
    await createFirestoreAuditEvent({
      eventType: "REVIEW_SUBMITTED",
      reviewId: reviewRef.id,
      orderId: input.orderId,
      productId: input.productId,
      actorId: input.userId,
      actorRole: "CUSTOMER",
      payload: { rating: input.rating, title: input.title, tokenId: input.tokenId },
      anchorMock: true
    });

  } catch (error) {
    console.error("Failed to submit review:", error);
    throw new Error("Review submission failed.");
  }
}

/**
 * Allows a customer to mark their own review as RESOLVED.
 */
export async function markReviewResolved(reviewId: string, userId: string): Promise<void> {
  const review = await getReviewById(reviewId);
  if (!review || review.userId !== userId) throw new Error("Unauthorized or Review not found");

  const allowedStatuses = ["ACTIVE", "EDITED", "MERCHANT_RESPONDED", "DISPUTED", "UNDER_REVIEW"];
  if (!allowedStatuses.includes(review.status)) throw new Error("Review cannot be resolved in current state");

  const prevStatus = review.status;
  const now = new Date().toISOString();

  await updateDoc(doc(firestoreDb, "reviews", reviewId), {
    status: "RESOLVED",
    updatedAt: now
  });

  await createFirestoreAuditEvent({
    eventType: "REVIEW_RESOLVED",
    reviewId: reviewId,
    actorId: userId,
    actorRole: "CUSTOMER",
    payload: { previousStatus: prevStatus, newStatus: "RESOLVED" },
    anchorMock: true
  });
}

/**
 * Allows a customer to WITHDRAW their review.
 */
export async function withdrawReview(reviewId: string, userId: string): Promise<void> {
  const review = await getReviewById(reviewId);
  if (!review || review.userId !== userId) throw new Error("Unauthorized or Review not found");

  if (["STRICKEN", "WITHDRAWN"].includes(review.status)) throw new Error("Review already finalized");

  const prevStatus = review.status;
  const now = new Date().toISOString();

  await updateDoc(doc(firestoreDb, "reviews", reviewId), {
    status: "WITHDRAWN",
    updatedAt: now
  });

  await createFirestoreAuditEvent({
    eventType: "REVIEW_WITHDRAWN",
    reviewId: reviewId,
    actorId: userId,
    actorRole: "CUSTOMER",
    payload: { previousStatus: prevStatus, newStatus: "WITHDRAWN" },
    anchorMock: true
  });
}

/**
 * Allows a merchant to reply to a review. 
 */
export async function createMerchantReply(input: { reviewId: string, merchantId: string, content: string }): Promise<void> {
  const replyRef = doc(collection(firestoreDb, "merchantReplies"));
  const now = new Date().toISOString();
  
  await setDoc(replyRef, {
    ...input,
    createdAt: now
  });

  await updateDoc(doc(firestoreDb, "reviews", input.reviewId), {
    status: "MERCHANT_RESPONDED",
    updatedAt: now
  });

  await createFirestoreAuditEvent({
    eventType: "MERCHANT_RESPONDED",
    reviewId: input.reviewId,
    replyId: replyRef.id,
    actorId: input.merchantId,
    actorRole: "MERCHANT",
    payload: { content: input.content },
    anchorMock: true
  });
}

/**
 * Initiates a formal dispute against a review.
 */
export async function openDispute(input: { reviewId: string, merchantId: string, reason: string, description: string }): Promise<void> {
  const disputeRef = doc(collection(firestoreDb, "disputes"));
  const now = new Date().toISOString();

  await setDoc(disputeRef, {
    ...input,
    status: "OPEN",
    createdAt: now,
    updatedAt: now
  });

  await updateDoc(doc(firestoreDb, "reviews", input.reviewId), {
    status: "DISPUTED",
    updatedAt: now
  });

  await createFirestoreAuditEvent({
    eventType: "DISPUTE_OPENED",
    reviewId: input.reviewId,
    disputeId: disputeRef.id,
    actorId: input.merchantId,
    actorRole: "MERCHANT",
    payload: { reason: input.reason, description: input.description },
    anchorMock: true
  });
}