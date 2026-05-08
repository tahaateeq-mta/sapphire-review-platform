import { UserProfile, Product } from './types';

/**
 * Standardized Mock Users for Sapphire Review Platform Demo.
 * Includes all required UserProfile fields from the phase-7.0 schema.
 */
export const mockUsers: UserProfile[] = [
  { 
    uid: 'u1', 
    name: 'Demo Customer', 
    email: 'customer@sapphire.test', 
    role: 'CUSTOMER', 
    publicId: 'reviewer_u1d8a2', // Required for privacy-focused audit timeline
    status: 'ACTIVE',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-01-15T10:00:00Z'
  },
  { 
    uid: 'u2', 
    name: 'K&K Electronics', 
    email: 'merchant@sapphire.test', 
    role: 'MERCHANT', 
    publicId: 'merchant_k&k01',
    merchantId: 'u2_merchant_id', // Secondary identifier for merchant queries[cite: 1]
    status: 'ACTIVE',
    createdAt: '2023-01-10T10:00:00Z',
    updatedAt: '2023-01-10T10:00:00Z'
  },
  { 
    uid: 'u3', 
    name: 'Sapphire Admin', 
    email: 'admin@sapphire.test', 
    role: 'ADMIN', 
    publicId: 'admin_root_01',
    status: 'ACTIVE',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z'
  },
];

/**
 * Standardized Mock Products.
 * Includes category, stock, and status fields to align with Repaired Pass 1.
 */
export const mockProducts: Product[] = [
  { 
    id: 'p1', 
    merchantId: 'u2_merchant_id', 
    merchantUid: 'u2', 
    name: 'K&K Wireless Headphones', 
    description: 'Premium noise-cancelling wireless headphones with 40-hour battery life.', 
    category: 'Electronics', // Required field[cite: 1]
    price: 199.99, 
    stock: 50, // Required field[cite: 1]
    imageUrl: '/api/placeholder/400/300', 
    status: 'ACTIVE', 
    createdAt: '2023-02-01T10:00:00Z',
    updatedAt: '2023-02-01T10:00:00Z'
  },
  { 
    id: 'p2', 
    merchantId: 'u2_merchant_id', 
    merchantUid: 'u2', 
    name: 'Sapphire Mechanical Keyboard', 
    description: 'Tactile mechanical keyboard featuring customizable RGB and hot-swappable switches.', 
    category: 'Accessories', 
    price: 129.99, 
    stock: 12, 
    imageUrl: '/api/placeholder/400/300', 
    status: 'ACTIVE', 
    createdAt: '2023-02-02T10:00:00Z',
    updatedAt: '2023-02-02T10:00:00Z'
  },
  { 
    id: 'p3', 
    merchantId: 'u2_merchant_id', 
    merchantUid: 'u2', 
    name: 'Nova Smart Watch', 
    description: 'Comprehensive health tracking including heart rate and sleep analysis.', 
    category: 'Fitness', 
    price: 249.99, 
    stock: 0, // Tests the "Out of Stock" UI state[cite: 10]
    imageUrl: '/api/placeholder/400/300', 
    status: 'ACTIVE', 
    createdAt: '2023-02-03T10:00:00Z',
    updatedAt: '2023-02-03T10:00:00Z'
  }
];