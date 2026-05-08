import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { firestoreDb } from "../client";
import { Order } from "../../types"; 
import { createFirestoreAuditEvent } from "./auditService";
import { generatePoPToken } from "./popTokenService";
import { ensurePoPTokenActive } from "./popTokenService"; // Added for delivery flow

export interface CreateOrderInput {
  userId: string;
  merchantId: string;
  merchantUid?: string;
  productId: string;
  price: number;
  quantity?: number;
  totalPrice?: number;
  customerName?: string;
  customerEmail?: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderRef = doc(collection(firestoreDb, "orders"));
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderRef.id,
    userId: input.userId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    merchantId: input.merchantId,
    merchantUid: input.merchantUid,
    productId: input.productId,
    status: "PENDING",
    quantity: input.quantity || 1,
    totalPrice: input.totalPrice || input.price,
    createdAt: now,
    updatedAt: now
  };

  await setDoc(orderRef, newOrder);
  await generatePoPToken(orderRef.id, input.productId, input.userId, input.merchantId);

  await createFirestoreAuditEvent({
    eventType: "ORDER_CREATED",
    orderId: orderRef.id,
    productId: input.productId,
    actorId: input.userId,
    actorRole: "CUSTOMER",
    payload: { ...newOrder },
    anchorMock: true
  });

  return newOrder;
}

// --- Added for FYP Demo Flow ---

export async function markOrderShipped(orderId: string, actorId: string): Promise<void> {
  const orderRef = doc(firestoreDb, "orders", orderId);
  const now = new Date().toISOString();

  await updateDoc(orderRef, { 
    status: "SHIPPED", 
    updatedAt: now 
  });

  await createFirestoreAuditEvent({
    eventType: "ORDER_SHIPPED",
    orderId,
    actorId,
    actorRole: "CUSTOMER",
    payload: { status: "SHIPPED" },
    anchorMock: true
  });
}

export async function markOrderDelivered(orderId: string, actorId: string): Promise<void> {
  const orderRef = doc(firestoreDb, "orders", orderId);
  const now = new Date().toISOString();

  await updateDoc(orderRef, { 
    status: "DELIVERED", 
    deliveredAt: now,
    updatedAt: now 
  });

  // Activates PoP Token so "Leave Verified Review" button appears[cite: 11]
  await ensurePoPTokenActive(orderId);

  await createFirestoreAuditEvent({
    eventType: "ORDER_DELIVERED",
    orderId,
    actorId,
    actorRole: "CUSTOMER",
    payload: { status: "DELIVERED" },
    anchorMock: true
  });
}

// --- End of Added Functions ---

export async function getOrder(orderId: string): Promise<Order | null> {
  const docRef = doc(firestoreDb, "orders", orderId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } as Order : null;
}

export async function getOrdersForCustomer(userId: string): Promise<Order[]> {
  const q = query(collection(firestoreDb, "orders"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersForMerchant(merchantId: string): Promise<Order[]> {
  const q = query(collection(firestoreDb, "orders"), where("merchantId", "==", merchantId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  const orderRef = doc(firestoreDb, "orders", orderId);
  const now = new Date().toISOString();
  await updateDoc(orderRef, { status, updatedAt: now });

  await createFirestoreAuditEvent({
    eventType: "ORDER_STATUS_UPDATED",
    orderId,
    actorId: "SYSTEM",
    actorRole: "SYSTEM",
    payload: { newStatus: status },
    anchorMock: true
  });
}