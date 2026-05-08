// lib/firebase/storageService.ts

/**
 * FIREBASE STORAGE PLACEHOLDER
 * Image uploading will be implemented in a future phase. 
 * Currently, the app uses standard external URLs or mock placeholder strings.
 */

export async function uploadProductImagePlaceholder(file: File): Promise<string> {
  console.warn("Firebase Storage is not fully configured for this prototype phase.");
  throw new Error("Firebase Storage image upload will be implemented in a future phase.");
}

export async function uploadReviewEvidencePlaceholder(file: File): Promise<string> {
  console.warn("Firebase Storage is not fully configured for this prototype phase.");
  throw new Error("Review image upload is disabled for this prototype.");
}