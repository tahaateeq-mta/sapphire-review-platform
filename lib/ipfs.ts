// Define the interface locally since it was removed from types.ts
export interface MockIPFSResult {
  cid: string;
  storedAt: string;
  mode: "mock";
}

export const IPFS_CONFIG = {
  mode: "mock",
  gatewayBaseUrl: "https://gateway.pinata.cloud/ipfs/"
};

export function generateMockCID(input?: unknown): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = 'bafybeigdyrzt';
  for (let i = 0; i < 46; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * This is mock IPFS storage for FYP demonstration. 
 * In production, this interface can be replaced with Pinata, Web3.Storage, 
 * NFT.Storage, or another IPFS pinning provider.
 */
export async function storeReviewContentOnIPFS(input: {
  reviewId: string;
  rating: number;
  title: string;
  content: string;
  productId: string;
  orderId: string;
  createdAt: string;
}): Promise<MockIPFSResult> {
  // Simulate network delay for realistic UX
  const delay = Math.floor(Math.random() * 400) + 200;
  await new Promise(resolve => setTimeout(resolve, delay));

  const cid = generateMockCID(input);
  
  // Phase 6 strict return type (uri and gatewayUrl were removed from the interface)
  return {
    cid,
    storedAt: new Date().toISOString(),
    mode: "mock"
  };
}