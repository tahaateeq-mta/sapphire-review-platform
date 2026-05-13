"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getUserProfile, logoutFirebase } from "@/lib/firebase/authService";
import type { Role, UserProfile } from "@/lib/types";
import { clearCurrentUser, setCurrentUser } from "@/lib/demoStore";

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

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  role: null,
  loading: true,
  isCustomer: false,
  isMerchant: false,
  isAdmin: false,
  signOutUser: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserFb] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);

      setUserProfile(profile);

      if (profile) {
        setCurrentUser(profile.uid, profile);
      } else {
        clearCurrentUser();
      }
    } catch (error) {
      console.error("Auth Error: Could not retrieve profile from ledger.", error);
      setUserProfile(null);
      clearCurrentUser();
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setCurrentUserFb(null);
      setUserProfile(null);
      clearCurrentUser();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setLoading(true);

      try {
        setCurrentUserFb(user);

        if (user) {
          await fetchProfile(user.uid);
        } else {
          setUserProfile(null);
          clearCurrentUser();
        }
      } catch (error) {
        console.error("Auth state sync failed:", error);
        setCurrentUserFb(null);
        setUserProfile(null);
        clearCurrentUser();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signOutUser = useCallback(async () => {
    try {
      setLoading(true);

      await logoutFirebase();

      setCurrentUserFb(null);
      setUserProfile(null);
      clearCurrentUser();
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!currentUser?.uid) return;

    await fetchProfile(currentUser.uid);
  }, [currentUser?.uid, fetchProfile]);

  const role = userProfile?.role || null;

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      userProfile,
      role,
      loading,
      isCustomer: role === "CUSTOMER",
      isMerchant: role === "MERCHANT",
      isAdmin: role === "ADMIN",
      signOutUser,
      refreshProfile,
    }),
    [currentUser, userProfile, role, loading, signOutUser, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);