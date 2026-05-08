import { AuditEvent, Role } from "./types";
import { generateHash } from "./hash";

export function createAuditEvent(input: {
  eventType: string; 
  reviewId?: string; 
  orderId?: string; 
  productId?: string; 
  targetId?: string;
  actorId: string; 
  actorRole: Role | "SYSTEM" | string; 
  actorPublicId?: string; 
  payload?: unknown; 
  previousEventHash?: string;
}): AuditEvent {
  // Destructure to separate the conflicting keys from the rest of the input
  const { eventType, actorId, actorRole, ...rest } = input;
  
  const payloadString = input.payload ? JSON.stringify(input.payload) : "{}";
  const payloadHash = generateHash(payloadString);
  const timestamp = new Date().toISOString();
  
  const target = input.targetId || input.reviewId || input.orderId || input.productId || "SYSTEM";
  const eventHash = generateHash(`${eventType}-${target}-${actorId}-${payloadHash}-${input.previousEventHash}-${timestamp}`);

  // Construct the object without duplicate keys
  const event: any = {
    ...rest,
    id: `AE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventType: eventType,
    targetId: target,
    actorId: actorId,
    actorRole: actorRole,
    timestamp: timestamp,
    blockchainStatus: "PENDING",
    payloadHash,
    eventHash,
    createdAt: timestamp,
    anchorMode: "mock"
  };

  return event as AuditEvent;
}

export function getPreviousEventHashForOrder(orderId: string, events: any[]): string | undefined {
  const orderEvents = events
    .filter(e => e.orderId === orderId || e.targetId === orderId)
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  return orderEvents.length > 0 ? (orderEvents[0].eventHash || orderEvents[0].transactionHash) : undefined;
}

export function getPreviousEventHashForReview(reviewId: string, events: any[]): string | undefined {
  const reviewEvents = events
    .filter(e => e.reviewId === reviewId || e.targetId === reviewId)
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  return reviewEvents.length > 0 ? (reviewEvents[0].eventHash || reviewEvents[0].transactionHash) : undefined;
}