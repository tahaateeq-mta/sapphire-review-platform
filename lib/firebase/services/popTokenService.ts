import { collection, doc, setDoc, getDocs, query, where, limit, updateDoc } from "firebase/firestore";
import { firestoreDb } from "../client";
import { PoPToken } from "../../types"; 
import { createFirestoreAuditEvent } from "./auditService";

// Helper to generate SHA-256 hash using Web Crypto API
async function generateHash(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * NEW: Ensures an active PoP token exists for an order during the delivery flow.
 * Prevents duplicate tokens and resolves the import error in orderService.ts.
 */
export async function ensurePoPTokenActive(orderId: string): Promise<void> {
  // Check if a token already exists to prevent duplicates
  const existing = await getPoPTokenForOrder(orderId);
  if (existing) return;

  // Retrieve order details from Firestore to get necessary IDs[cite: 11]
  const orderRef = doc(firestoreDb, "orders", orderId);
  const orderSnap = await getDocs(query(collection(firestoreDb, "orders"), where("id", "==", orderId)));
  
  if (orderSnap.empty) {
    console.error("Order not found for token activation");
    return;
  }

  const orderData = orderSnap.docs[0].data();

  // Generate the new token using your existing logic[cite: 11, 23]
  await generatePoPToken(
    orderId,
    orderData.productId,
    orderData.userId,
    orderData.merchantId
  );
}

/**
 * Generates a Proof-of-Purchase (PoP) token for a specific order.
 * This token is required for customers to leave verified reviews.[cite: 23]
 */
export async function generatePoPToken(
  orderId: string, 
  productId: string, 
  userId: string, 
  merchantId: string
): Promise<PoPToken> {
  const tokenRef = doc(collection(firestoreDb, "popTokens"));
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + 30); 

  const tokenHash = await generateHash(`${orderId}-${userId}-${now.getTime()}`);

  const newToken: PoPToken = {
    id: tokenRef.id,
    tokenHash,
    orderId,
    productId,
    userId,
    merchantId,
    status: "ACTIVE",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  try {
    await setDoc(tokenRef, newToken);

    await createFirestoreAuditEvent({
      eventType: "POP_TOKEN_GENERATED",
      tokenId: tokenRef.id,
      orderId,
      productId,
      actorId: "SYSTEM",
      actorRole: "ADMIN",
      payload: { tokenId: tokenRef.id, tokenHash, orderId, productId, userId, status: "ACTIVE" },
      anchorMock: true 
    });

    return newToken;
  } catch (error) {
    console.error("Failed to generate PoP token:", error);
    throw new Error("Token generation failed.");
  }
}

/**
 * Retrieves an active PoP token for a specific order.[cite: 23]
 */
export async function getPoPTokenForOrder(orderId: string): Promise<PoPToken | null> {
  const q = query(collection(firestoreDb, "popTokens"), where("orderId", "==", orderId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as PoPToken;
}

/**
 * Marks a token as consumed after a review is successfully submitted.[cite: 23]
 */
export async function consumePoPToken(tokenId: string): Promise<void> {
  const tokenRef = doc(firestoreDb, "popTokens", tokenId);
  await updateDoc(tokenRef, { 
    status: "CONSUMED", 
    updatedAt: new Date().toISOString() 
  });
}