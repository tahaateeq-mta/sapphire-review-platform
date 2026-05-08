import { collection, getDocs } from "firebase/firestore";
import { firestoreDb } from "../client";

// Creates the merchant via the secure Admin API
export async function createMerchantAsAdmin(input: {
  businessName: string;
  contactName: string;
  email: string;
  password: string;
  phone?: string;
}, idToken: string) {
  const res = await fetch('/api/admin/create-merchant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(input)
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to create merchant.");
  }
  return data;
}

// Fetches the list of merchants for the Admin Directory
export async function getMerchants() {
  const snapshot = await getDocs(collection(firestoreDb, 'merchants'));
  return snapshot.docs.map(doc => doc.data());
}