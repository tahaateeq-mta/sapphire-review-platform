import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing or invalid authorization token." }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];

    // 2. Verify Token & Admin Status
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!adminDoc.exists || adminDoc.data()?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    // 3. Parse Input
    const { businessName, contactName, email, password, phone } = await req.json();
    if (!businessName || !contactName || !email || !password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Invalid input. Check required fields and password length." }, { status: 400 });
    }

    // 4. Create Firebase Auth User for Merchant
    const merchantUserRecord = await adminAuth.createUser({
      email,
      password,
      displayName: contactName,
      ...(phone && { phoneNumber: phone })
    });

    const merchantUid = merchantUserRecord.uid;
    const merchantId = `MERCH-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 5. Create Merchant Record
    await adminDb.collection('merchants').doc(merchantId).set({
      id: merchantId,
      ownerUid: merchantUid,
      businessName,
      contactName,
      email,
      phone: phone || null,
      status: "ACTIVE",
      createdAt: timestamp,
      updatedAt: timestamp
    });

    // 6. Create User Profile
    await adminDb.collection('users').doc(merchantUid).set({
      uid: merchantUid,
      name: contactName,
      email,
      phone: phone || null,
      role: "MERCHANT",
      publicId: "merchant_" + merchantUid.slice(0, 6),
      merchantId,
      status: "ACTIVE",
      createdAt: timestamp,
      updatedAt: timestamp
    });

    // 7. Set Custom Claims
    await adminAuth.setCustomUserClaims(merchantUid, { role: "MERCHANT", merchant: true, merchantId });

    return NextResponse.json({ success: true, merchantId, email });

  } catch (error: any) {
    console.error("Create merchant error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}