import { 
  UserProfile, 
  Product, 
  Order, 
  PoPToken, 
  Review, 
  ReviewVersion, 
  MerchantReply, 
  Dispute, 
  AuditEvent 
} from './types';
import { mockUsers, mockProducts } from './mockData';
import { anchorAuditEventToBlockchain } from './blockchain';

export interface DemoState {
  version: string;
  users: UserProfile[]; // Standardized to UserProfile
  products: Product[];
  orders: Order[];
  popTokens: PoPToken[];
  reviews: Review[];
  reviewVersions: ReviewVersion[];
  merchantReplies: MerchantReply[];
  disputes: Dispute[];
  auditEvents: AuditEvent[];
  currentUserId?: string;
}

const STORAGE_KEY = 'sapphire_demo_state';
const DEMO_STATE_VERSION = 'phase-7.0'; // Forces a reset to apply new type structures

export function getDemoState(): DemoState {
  if (typeof window === 'undefined') return seedInitialState();
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsedState = JSON.parse(stored);
      // Strict version checking to prevent crashes during the presentation[cite: 17]
      if (parsedState.version !== DEMO_STATE_VERSION) {
        console.warn("Demo state version mismatch. Resetting demo data to maintain stability.");
        localStorage.removeItem(STORAGE_KEY);
        return seedInitialState();
      }
      return parsedState as DemoState;
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
      return seedInitialState();
    }
  }
  
  return seedInitialState();
}

function seedInitialState(): DemoState {
  // Seeds the initial environment with mock data mapped to new interfaces[cite: 17]
  const initialState: DemoState = {
    version: DEMO_STATE_VERSION,
    users: mockUsers as any[], 
    products: mockProducts, 
    orders: [], 
    popTokens: [], 
    reviews: [], 
    reviewVersions: [], 
    merchantReplies: [], 
    disputes: [], 
    auditEvents: [], 
    currentUserId: undefined
  };
  saveDemoState(initialState);
  return initialState;
}

export function saveDemoState(state: DemoState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function resetDemoState() {
  if (typeof window !== 'undefined') { 
    localStorage.removeItem(STORAGE_KEY); 
    alert("Demo data reset successfully.");
    window.location.href = '/'; 
  }
}

export function getCurrentUser(): UserProfile | undefined {
  const state = getDemoState();
  if (!state.currentUserId) return undefined;
  // Fallback to check both uid (repaired) and id (legacy mock) for identifier matching
  return state.users.find((u: any) => u.uid === state.currentUserId || u.id === state.currentUserId);
}

/**
 * Dynamically injects live Firebase profiles into the mock array to maintain 
 * cross-mode consistency during the demo[cite: 17].
 */
export function setCurrentUser(userId: string, profile?: any) {
  const state = getDemoState();
  state.currentUserId = userId;
  
  // If this is a new live user not yet in our mock state, synchronize it[cite: 17]
  if (profile && !state.users.find((u: any) => u.uid === userId || u.id === userId)) {
    state.users.push({
      uid: profile.uid || userId,
      name: profile.name,
      email: profile.email || '',
      role: profile.role,
      publicId: profile.publicId,
      status: profile.status || "ACTIVE",
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: profile.updatedAt || new Date().toISOString()
    } as UserProfile);
  }
  
  saveDemoState(state);
  window.dispatchEvent(new Event('authStateChanged'));
}

export function clearCurrentUser() {
  const state = getDemoState();
  state.currentUserId = undefined;
  saveDemoState(state);
  window.dispatchEvent(new Event('authStateChanged'));
}

/**
 * Iterates through the ledger and anchors all pending events using the 
 * repaired BlockchainStatus types.
 */
export async function anchorAllUnanchoredEvents(): Promise<AuditEvent[]> {
  const state = getDemoState();
  let updated = false;

  for (let i = 0; i < state.auditEvents.length; i++) {
    const ev = state.auditEvents[i];
    
    // Status check against repaired BlockchainStatus values[cite: 1]
    const status = ev.blockchainStatus;

    if (!status || status === 'NOT_ANCHORED' || status === 'PENDING' || status === 'FAILED') {
      try {
        const metadata = await anchorAuditEventToBlockchain(ev);
        // Explicitly cast to the repaired AuditEvent to merge metadata[cite: 1, 17]
        state.auditEvents[i] = { ...ev, ...metadata } as AuditEvent;
        updated = true;
      } catch (error) {
        state.auditEvents[i] = { ...ev, blockchainStatus: "FAILED" } as AuditEvent;
        updated = true;
      }
    }
  }

  if (updated) saveDemoState(state);
  return state.auditEvents;
}