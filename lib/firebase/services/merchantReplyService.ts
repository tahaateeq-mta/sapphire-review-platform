import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreDb } from "../client";
import { MerchantReply } from "@/lib/types";
import { createFirestoreAuditEvent } from "./auditService";

const MERCHANT_REPLIES_COLLECTION = "merchantReplies";
const REVIEWS_COLLECTION = "reviews";

function mapMerchantReply(id: string, data: Record<string, unknown>): MerchantReply {
  return {
    id,
    reviewId: String(data.reviewId || ""),
    merchantId: String(data.merchantId || ""),
    merchantUid: data.merchantUid ? String(data.merchantUid) : undefined,
    content: String(data.content || ""),
    contentHash: data.contentHash ? String(data.contentHash) : undefined,
    createdAt: String(data.createdAt || ""),
  };
}

async function generateSHA256Hash(content: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getReplyForReview(
  reviewId: string
): Promise<MerchantReply | null> {
  if (!reviewId) {
    return null;
  }

  const replyQuery = query(
    collection(firestoreDb, MERCHANT_REPLIES_COLLECTION),
    where("reviewId", "==", reviewId)
  );

  const snapshot = await getDocs(replyQuery);

  if (snapshot.empty) {
    return null;
  }

  const replies = snapshot.docs
    .map((docSnap) => mapMerchantReply(docSnap.id, docSnap.data()))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  return replies[0] || null;
}

export async function getRepliesForReviews(
  reviewIds: string[]
): Promise<MerchantReply[]> {
  if (!reviewIds.length) {
    return [];
  }

  const replies: MerchantReply[] = [];

  for (const reviewId of reviewIds) {
    const reply = await getReplyForReview(reviewId);

    if (reply) {
      replies.push(reply);
    }
  }

  return replies;
}

export async function createMerchantReply(input: {
  reviewId: string;
  merchantUid: string;
  merchantId: string;
  content: string;
}): Promise<MerchantReply> {
  if (!input.reviewId) {
    throw new Error("Missing reviewId.");
  }

  if (!input.merchantUid) {
    throw new Error("Missing merchantUid.");
  }

  if (!input.merchantId) {
    throw new Error("Missing merchantId.");
  }

  if (!input.content || input.content.trim().length < 10) {
    throw new Error("Merchant reply must be at least 10 characters.");
  }

  const existingReply = await getReplyForReview(input.reviewId);

  if (existingReply) {
    throw new Error("A merchant reply already exists for this review.");
  }

  const now = new Date().toISOString();
  const cleanContent = input.content.trim();
  const contentHash = await generateSHA256Hash(cleanContent);

  const replyId = `rep_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  const reply: MerchantReply = {
    id: replyId,
    reviewId: input.reviewId,
    merchantId: input.merchantId,
    merchantUid: input.merchantUid,
    content: cleanContent,
    contentHash,
    createdAt: now,
  };

  await setDoc(doc(firestoreDb, MERCHANT_REPLIES_COLLECTION, replyId), reply);

  await updateDoc(doc(firestoreDb, REVIEWS_COLLECTION, input.reviewId), {
    status: "MERCHANT_RESPONDED",
    updatedAt: now,
  });

  await createFirestoreAuditEvent({
    eventType: "MERCHANT_RESPONDED",
    reviewId: input.reviewId,
    replyId,
    actorId: input.merchantUid,
    actorRole: "MERCHANT",
    actorPublicId: `merchant_${input.merchantUid.slice(0, 6)}`,
    payload: {
      reviewId: input.reviewId,
      replyId,
      merchantId: input.merchantId,
      contentHash,
      status: "MERCHANT_RESPONDED",
    },
    details: `Merchant replied with hash ${contentHash.substring(0, 8)}...`,
    anchorMock: true,
  });

  return reply;
}