// app/api/admin/bootstrap/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, adminEmail, adminPassword, adminName } = body;

    // 1. Strict Security Check
    const serverSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!serverSecret) {
      return NextResponse.json({ error: "Server misconfiguration: Missing ADMIN_BOOTSTRAP_SECRET in environment variables." }, { status: 500 });
    }

    if (secret !== serverSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid Bootstrap Secret" }, { status: 403 });
    }

    // 2. Validate input
    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 3. Create or Update user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(adminEmail);
      // Optional: Update password if user already exists
      userRecord = await adminAuth.updateUser(userRecord.uid, { password: adminPassword });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: adminName || 'System Admin',
        });
      } else {
        throw error;
      }
    }

    // 4. Force ADMIN role in Firestore Profile
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminEmail,
      name: adminName || 'System Admin',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true }); // Merge ensures we don't wipe existing data

    return NextResponse.json({ 
      success: true, 
      message: "Admin account bootstrapped securely.",
      uid: userRecord.uid 
    });

  } catch (error: any) {
    console.error("Bootstrap Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}