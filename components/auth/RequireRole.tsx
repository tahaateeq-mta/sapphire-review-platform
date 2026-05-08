"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
// Import the standardized Role type[cite: 1]
import { Role, UserProfile } from "@/lib/types"; 
import SmoothLink from "../animations/SmoothLink";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  // Destructure with proper typing from the updated AuthProvider[cite: 13, 14]
  const { role, loading, currentUser, userProfile } = useAuth() as {
    role: Role | null;
    loading: boolean;
    currentUser: any;
    userProfile: UserProfile | null;
  };
  
  const router = useRouter();

  // Unified role detection: support both direct context and profile object
  const currentRole = role || userProfile?.role;

  useEffect(() => {
    // Redirect to login if the session is finished loading and no user is found
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  // Loading state with unified FYP styling
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-white font-mono animate-pulse">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
        <p className="text-slate-400 uppercase tracking-widest text-xs">Authenticating Actor...</p>
      </div>
    );
  }

  // Prevent flash of content if redirecting[cite: 14]
  if (!currentUser) return null;

  // Authorization Check: Does the actor possess the required cryptographic role?
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center glass-panel p-10 rounded-3xl border border-red-500/20 shadow-2xl bg-red-500/[0.02]">
        <ShieldAlert size={64} className="text-red-500 mx-auto mb-6 drop-shadow-lg" />
        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Permission Denied</h2>
        
        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8 space-y-4">
          <p className="text-slate-400 text-sm font-light">
            Your current identity does not have authorized access to this ledger segment.
          </p>
          <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest pt-2 border-t border-white/5">
            <div>
              <span className="text-slate-600 block mb-1">Current Role</span>
              <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                {currentRole || "UNIDENTIFIED"}
              </span>
            </div>
            <div>
              <span className="text-slate-600 block mb-1">Required Access</span>
              <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                {allowedRoles.join(" | ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <SmoothLink 
            href="/store" 
            className="bg-slate-800 text-white px-8 py-3 rounded-xl hover:bg-slate-700 transition-all font-black text-xs uppercase tracking-widest border border-white/5"
          >
            Return to Store
          </SmoothLink>
          <SmoothLink 
            href="/login" 
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-500 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/30"
          >
            Switch Account
          </SmoothLink>
        </div>
      </div>
    );
  }

  // Permission granted: render requested resources[cite: 14]
  return <>{children}</>;
}