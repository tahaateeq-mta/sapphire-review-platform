import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "./client";
// Integrated the repaired UserProfile interface[cite: 1]
import { UserProfile } from "../types";

/**
 * Retrieves a user's cryptographic profile from the Firestore ledger.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(firestoreDb, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data() } as UserProfile;
  }
  return null;
}

/**
 * Ensures a valid Customer profile exists in Firestore. 
 * Enforces the standardized 'CUSTOMER' role and 'ACTIVE' status.
 */
export async function createCustomerProfileIfMissing(user: FirebaseUser, name?: string): Promise<UserProfile> {
  const existingProfile = await getUserProfile(user.uid);
  if (existingProfile) return existingProfile;

  const timestamp = new Date().toISOString();
  
  // Maps strictly to the repaired UserProfile type requirements
  const newProfile: UserProfile = {
    uid: user.uid,
    name: name || user.displayName || "Customer User",
    email: user.email ?? null,
    phone: user.phoneNumber ?? null,
    role: "CUSTOMER", // Repaired pass enforces uppercase Role[cite: 1]
    publicId: "reviewer_" + user.uid.slice(0, 6), // Truncated ID for audit timeline privacy
    status: "ACTIVE",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(doc(firestoreDb, "users", user.uid), newProfile);
  return newProfile;
}

/**
 * Executes Firebase Auth registration and initializes the Firestore profile.
 */
export async function registerCustomerWithEmail(input: { name: string; email: string; password: string }): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, input.email, input.password);
  return createCustomerProfileIfMissing(userCredential.user, input.name);
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function loginWithGoogle(): Promise<UserProfile | null> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  return createCustomerProfileIfMissing(result.user);
}

/**
 * Standardized logout: Flushes the session from Firebase Auth[cite: 16].
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(firebaseAuth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth, email);
}