import { AuditEvent } from "./types";

/**
 * DETERMINISTIC MOCK BLOCKCHAIN UTILITY
 * Updated for Repair Part 3: Strengthened Audit Events
 */

// Mode is driven by the environment variable. Default to mock if missing.
const ACTIVE_MODE = process.env.NEXT_PUBLIC_BLOCKCHAIN_MODE || "mock";

export const BLOCKCHAIN_CONFIG = {
  mode: ACTIVE_MODE,
  networkName: ACTIVE_MODE === "amoy" ? "Polygon Amoy Testnet" : "Polygon Amoy Testnet (Mock)",
  chainId: 80002,
  explorerBaseUrl: "https://amoy.polygonscan.com/tx/",
  contractAddress: process.env.NEXT_PUBLIC_REVIEW_AUDIT_CONTRACT_ADDRESS || ""
};

/**
 * FIXED: Now accepts an optional input string to resolve the ts(2554) error.
 * If an input (like eventHash) is provided, it uses it to create a deterministic hash.
 */
export function generateMockTxHash(input?: string): string {
  if (input) {
    // Deterministic mock hash based on input
    const prefix = input.substring(2, 10);
    const suffix = "4f7a8b9c2d1e0f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f";
    return "0x" + (prefix + suffix).substring(0, 64);
  }

  // Fallback to random if no input provided
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function generateMockBlockNumber(): number {
  // Realistic block range for Amoy testnet[cite: 1]
  return Math.floor(13000000 + Math.random() * 500000);
}

export function getExplorerUrl(txHash: string): string {
  return `${BLOCKCHAIN_CONFIG.explorerBaseUrl}${txHash}`;
}

/**
 * Handles the actual anchoring logic based on the configured environment mode.[cite: 1]
 */
export async function anchorAuditEventToBlockchain(event: AuditEvent): Promise<{
  blockchainStatus: string; 
  transactionHash: string; 
  blockNumber: number;
  networkName: string;
  chainId: number;
  explorerUrl: string;
  anchoredAt: string;
  anchorMode: "mock" | "amoy";
  blockchainError?: string;
}> {
  
  if (BLOCKCHAIN_CONFIG.mode === "amoy") {
    try {
      const res = await fetch('/api/anchor-amoy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to anchor to Polygon Amoy.");
      }

      return {
        ...data.data,
        transactionHash: data.data.blockchainTxHash || data.data.transactionHash,
        blockchainStatus: "ANCHORED",
        anchorMode: "amoy"
      };

    } catch (error: any) {
      console.error("Amoy Anchoring Error:", error.message);
      return {
        blockchainStatus: "FAILED",
        transactionHash: "",
        blockNumber: 0,
        networkName: BLOCKCHAIN_CONFIG.networkName,
        chainId: BLOCKCHAIN_CONFIG.chainId,
        explorerUrl: "",
        anchoredAt: new Date().toISOString(),
        anchorMode: "amoy",
        blockchainError: error.message
      };
    }
  }

  // ==========================================
  // FALLBACK: MOCK MODE (UPDATED)[cite: 1]
  // ==========================================
  const delay = Math.floor(Math.random() * 500) + 300;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Pass eventHash to ensure the transaction looks "linked" to the event[cite: 1]
  const txHash = generateMockTxHash(event.eventHash);
  
  return {
    blockchainStatus: "MOCK_CONFIRMED",
    transactionHash: txHash,
    blockNumber: generateMockBlockNumber(),
    networkName: BLOCKCHAIN_CONFIG.networkName,
    chainId: BLOCKCHAIN_CONFIG.chainId,
    explorerUrl: getExplorerUrl(txHash),
    anchoredAt: new Date().toISOString(),
    anchorMode: "mock"
  };
}