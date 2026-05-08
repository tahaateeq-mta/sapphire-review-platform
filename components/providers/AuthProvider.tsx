"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client';
import { getUserProfile, logoutFirebase } from '@/lib/firebase/authService';
// Import the repaired types from lib/types.ts[cite: 1]
import { UserProfile, Role } from '@/lib/types';
import { setCurrentUser, clearCurrentUser } from '@/lib/demoStore';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  isCustomer: boolean;
  isMerchant: boolean;
  isAdmin: boolean;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserFb] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Synchronizes the Firestore UserProfile with the Auth context.
   */
  const fetchProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
      
      // Update demoStore for hybrid mock/live consistency
      if (profile) {
        // Casting is no longer needed as UserProfile now matches in both files[cite: 1]
        setCurrentUser(profile.uid, profile); 
      }
    } catch (error) {
      console.error("Auth Error: Could not retrieve profile from ledger.", error);
    }
  };

  useEffect(() => {
    // Safety check for Next.js build time and environment configuration
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setCurrentUserFb(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setUserProfile(null);
        clearCurrentUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    try {
      await logoutFirebase();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid);
    }
  };

  // Derive role based on the repaired UserProfile schema
  const role = userProfile?.role || null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      role,
      loading,
      isCustomer: role === 'CUSTOMER',
      isMerchant: role === 'MERCHANT',
      isAdmin: role === 'ADMIN',
      signOutUser,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for accessing the verified auth context throughout the app[cite: 13]
export const useAuth = () => useContext(AuthContext);