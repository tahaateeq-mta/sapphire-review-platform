export type Role = "CUSTOMER" | "MERCHANT" | "ADMIN";
export type UserRole = Role;

export type ProductStatus = "ACTIVE" | "DRAFT" | "DISABLED";

export type OrderStatus = "PROCESSING" | "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type PoPTokenStatus = "ACTIVE" | "USED" | "CONSUMED" | "EXPIRED" | "REVOKED" | "NOT_CREATED";

export type ReviewStatus =
  | "ACTIVE"
  | "EDITED"
  | "MERCHANT_RESPONDED"
  | "DISPUTED"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "STRICKEN"
  | "WITHDRAWN"
  | "ARCHIVED";

export type BlockchainStatus =
  | "NOT_ANCHORED"
  | "PENDING"
  | "MOCK_CONFIRMED"
  | "CONFIRMED"
  | "FAILED";

export interface UserProfile {
  uid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  publicId: string;
  merchantId?: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  merchantUid?: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  image?: string; // legacy fallback
  stock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  displayId?: string;
  userId: string;
  customerName?: string;
  customerEmail?: string | null;
  merchantId: string;
  merchantUid?: string;
  productId: string;
  status: OrderStatus;
  quantity?: number;
  totalPrice?: number;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
}

export interface PoPToken {
  id: string;
  tokenHash: string;
  orderId: string;
  productId: string;
  userId: string;
  merchantId: string;
  status: PoPTokenStatus;
  createdAt: string;
  usedAt?: string;
  expiresAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  userId: string;
  merchantId: string;
  merchantUid?: string;
  rating: number;
  title: string;
  content: string;
  status: ReviewStatus;
  currentVersion?: number;
  createdAt: string;
  updatedAt: string;
  contentHash: string;
  storageReference?: string;
  ipfsCid?: string;
  ipfsGatewayUrl?: string;
  storageMode?: "mock" | "ipfs" | "database";
  storedAt?: string;
  blockchainTx?: string; // legacy fallback
}

export interface ReviewVersion {
  id: string;
  reviewId: string;
  versionNumber: number;
  rating: number;
  title: string;
  content: string;
  contentHash: string;
  createdAt: string;
}

export interface MerchantReply {
  id: string;
  reviewId: string;
  merchantId: string;
  merchantUid?: string;
  content: string;
  contentHash?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  reviewId: string;
  productId?: string;
  merchantId?: string;
  openedBy: string;
  reason: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  adminDecision?: string;
  adminNoteHash?: string;
  createdAt: string;
  resolvedAt?: string;
  updatedAt?: string;
}

export type AuditEventType =
  | "ORDER_CREATED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "POP_TOKEN_GENERATED"
  | "POP_TOKEN_USED"
  | "REVIEW_SUBMITTED"
  | "REVIEW_EDITED"
  | "MERCHANT_RESPONDED"
  | "DISPUTE_OPENED"
  | "DISPUTE_UPDATED"
  | "ADMIN_DECISION"
  | "REVIEW_RESOLVED"
  | "REVIEW_STRICKEN"
  | "REVIEW_WITHDRAWN"
  | "REVIEW_RESTORED"
  | "BLOCKCHAIN_ANCHORED"
  | string;

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  reviewId?: string;
  orderId?: string;
  productId?: string;
  tokenId?: string;
  disputeId?: string;
  replyId?: string;
  actorId: string;
  actorRole: "CUSTOMER" | "MERCHANT" | "ADMIN" | "SYSTEM";
  actorPublicId?: string;
  payloadHash?: string;
  previousEventHash?: string;
  eventHash?: string;
  targetId?: string;
  details?: unknown;
  timestamp?: string; // legacy fallback
  createdAt: string;
  blockchainStatus?: BlockchainStatus;
  blockchainTxHash?: string;
  transactionHash?: string; // legacy fallback
  blockNumber?: number;
  networkName?: string;
  chainId?: number;
  explorerUrl?: string;
  anchoredAt?: string;
  anchorMode?: "mock" | "amoy" | "none";
  blockchainError?: string;
}