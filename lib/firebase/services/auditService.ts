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
import { AuditEvent } from "../../types";
import { generateHash } from "../../hash";
import { generateMockBlockNumber, generateMockTxHash } from "../../blockchain";

const AUDIT_EVENTS_COLLECTION = "auditEvents";

function getAuditEventTime(event: AuditEvent): number {
  return new Date(event.createdAt || event.timestamp || 0).getTime();
}

function sortNewestFirst(events: AuditEvent[]): AuditEvent[] {
  return events.sort((a, b) => getAuditEventTime(b) - getAuditEventTime(a));
}

function sortOldestFirst(events: AuditEvent[]): AuditEvent[] {
  return events.sort((a, b) => getAuditEventTime(a) - getAuditEventTime(b));
}

function cleanUndefinedValues(input: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

function buildMockAnchor(eventHash?: string) {
  const txHash = generateMockTxHash(eventHash || crypto.randomUUID());

  return {
    blockchainStatus: "MOCK_CONFIRMED" as const,
    blockchainTxHash: txHash,
    blockNumber: generateMockBlockNumber(),
    networkName: "Polygon Amoy (Mock)",
    chainId: 80002,
    explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`,
    anchoredAt: new Date().toISOString(),
    anchorMode: "mock" as const,
  };
}

function mapAuditEvent(id: string, data: Record<string, unknown>): AuditEvent {
  return {
    id,
    ...(data as Omit<AuditEvent, "id">),
  };
}

export async function getAllAuditEvents(): Promise<AuditEvent[]> {
  const snapshot = await getDocs(collection(firestoreDb, AUDIT_EVENTS_COLLECTION));

  const events = snapshot.docs.map((docSnap) =>
    mapAuditEvent(docSnap.id, docSnap.data())
  );

  return sortNewestFirst(events);
}

// Alias for Admin Page
export const getAuditEvents = getAllAuditEvents;

export async function getAuditEventsForReview(
  reviewId: string
): Promise<AuditEvent[]> {
  const auditQuery = query(
    collection(firestoreDb, AUDIT_EVENTS_COLLECTION),
    where("reviewId", "==", reviewId)
  );

  const snapshot = await getDocs(auditQuery);

  const events = snapshot.docs.map((docSnap) =>
    mapAuditEvent(docSnap.id, docSnap.data())
  );

  return sortOldestFirst(events);
}

export async function getAuditEventsForOrder(
  orderId: string
): Promise<AuditEvent[]> {
  const auditQuery = query(
    collection(firestoreDb, AUDIT_EVENTS_COLLECTION),
    where("orderId", "==", orderId)
  );

  const snapshot = await getDocs(auditQuery);

  const events = snapshot.docs.map((docSnap) =>
    mapAuditEvent(docSnap.id, docSnap.data())
  );

  return sortNewestFirst(events);
}

export async function getLatestEventHash(
  reviewId?: string,
  orderId?: string
): Promise<string | undefined> {
  let events: AuditEvent[] = [];

  if (reviewId) {
    events = await getAuditEventsForReview(reviewId);
  } else if (orderId) {
    events = await getAuditEventsForOrder(orderId);
  } else {
    return undefined;
  }

  const newestFirst = sortNewestFirst(events);
  return newestFirst[0]?.eventHash;
}

export async function anchorFirestoreAuditEvent(
  eventId: string
): Promise<AuditEvent | null> {
  const snapshot = await getDocs(collection(firestoreDb, AUDIT_EVENTS_COLLECTION));

  const matchingDoc = snapshot.docs.find((docSnap) => docSnap.id === eventId);

  if (!matchingDoc) {
    return null;
  }

  const event = mapAuditEvent(matchingDoc.id, matchingDoc.data());

  if (
    event.blockchainStatus === "MOCK_CONFIRMED" ||
    event.blockchainStatus === "CONFIRMED"
  ) {
    return event;
  }

  const updates = buildMockAnchor(event.eventHash);

  await updateDoc(
    doc(firestoreDb, AUDIT_EVENTS_COLLECTION, eventId),
    cleanUndefinedValues(updates)
  );

  return {
    ...event,
    ...updates,
  };
}

export async function anchorAllPendingFirestoreAuditEvents(): Promise<
  AuditEvent[]
> {
  const snapshot = await getDocs(collection(firestoreDb, AUDIT_EVENTS_COLLECTION));

  const pendingDocs = snapshot.docs.filter((docSnap) => {
    const event = docSnap.data() as AuditEvent;
    return (
      !event.blockchainStatus ||
      event.blockchainStatus === "NOT_ANCHORED" ||
      event.blockchainStatus === "FAILED" ||
      event.blockchainStatus === "PENDING"
    );
  });

  const results: AuditEvent[] = [];

  for (const pendingDoc of pendingDocs) {
    const event = mapAuditEvent(pendingDoc.id, pendingDoc.data());
    const updates = buildMockAnchor(event.eventHash);

    await updateDoc(pendingDoc.ref, cleanUndefinedValues(updates));

    results.push({
      ...event,
      ...updates,
    });
  }

  return results;
}

// Alias for logic compatibility
export async function anchorAllPendingEvents(): Promise<void> {
  await anchorAllPendingFirestoreAuditEvents();
}

export async function createFirestoreAuditEvent(input: {
  eventType: string;
  reviewId?: string;
  orderId?: string;
  productId?: string;
  tokenId?: string;
  disputeId?: string;
  replyId?: string;
  actorId: string;
  actorRole: "CUSTOMER" | "MERCHANT" | "ADMIN" | "SYSTEM";
  actorPublicId?: string;
  payload?: unknown;
  details?: unknown;
  anchorMock?: boolean;
}): Promise<AuditEvent> {
  const auditRef = doc(collection(firestoreDb, AUDIT_EVENTS_COLLECTION));
  const createdAt = new Date().toISOString();

  const payloadHash = generateHash(input.payload || input.details || {});
  const previousEventHash =
    (await getLatestEventHash(input.reviewId, input.orderId)) || "0xGenesis";

  const eventHash = generateHash({
    eventType: input.eventType,
    reviewId: input.reviewId,
    orderId: input.orderId,
    productId: input.productId,
    tokenId: input.tokenId,
    disputeId: input.disputeId,
    replyId: input.replyId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    actorPublicId: input.actorPublicId,
    payloadHash,
    previousEventHash,
    createdAt,
  });

  const baseEvent: AuditEvent = {
    id: auditRef.id,
    eventType: input.eventType,
    reviewId: input.reviewId,
    orderId: input.orderId,
    productId: input.productId,
    tokenId: input.tokenId,
    disputeId: input.disputeId,
    replyId: input.replyId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    actorPublicId: input.actorPublicId,
    details: input.details,
    createdAt,
    payloadHash,
    previousEventHash,
    eventHash,
    blockchainStatus: input.anchorMock ? "MOCK_CONFIRMED" : "NOT_ANCHORED",
    anchorMode: input.anchorMock ? "mock" : "none",
  };

  const eventWithAnchor: AuditEvent = input.anchorMock
    ? {
        ...baseEvent,
        ...buildMockAnchor(eventHash),
        anchoredAt: createdAt,
      }
    : baseEvent;

  await setDoc(auditRef, cleanUndefinedValues(eventWithAnchor));

  return eventWithAnchor;
}