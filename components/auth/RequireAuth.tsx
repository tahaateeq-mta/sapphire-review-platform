"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading authentication...</div>;
  if (!currentUser) return null;

  return <>{children}</>;
}