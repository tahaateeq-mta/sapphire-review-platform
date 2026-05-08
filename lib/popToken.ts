import { PoPToken } from "./types";
import { generateHash } from "./hash";

export function generatePoPToken(orderId: string, productId: string, userId: string, merchantId: string): PoPToken {
  // Added merchantId to the raw string to ensure the token hash is cryptographically bound to the merchant
  const rawToken = `POP-${orderId}-${productId}-${userId}-${merchantId}-${Math.random().toString(36).slice(2)}`;
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(); 
  expiresAt.setDate(expiresAt.getDate() + 90);
  
  return {
    id: `POP-${Date.now()}`,
    tokenHash: generateHash(rawToken),
    orderId, 
    productId, 
    userId,
    merchantId, // Added to strictly match Phase 6 schema
    status: "ACTIVE",
    createdAt: timestamp,
    expiresAt: expiresAt.toISOString()
  };
}