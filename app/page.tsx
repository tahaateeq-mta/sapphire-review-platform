"use client";

import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import { useAuth } from "@/components/providers/AuthProvider";
import { getDashboardRouteForRole } from "@/lib/auth/redirectByRole";

export default function Home() {
  const { userProfile, loading } = useAuth();

  const dashboardHref = userProfile?.role
    ? getDashboardRouteForRole(userProfile.role)
    : "/login";

  const dashboardLabel =
    userProfile?.role === "ADMIN"
      ? "Admin Dashboard"
      : userProfile?.role === "MERCHANT"
        ? "Merchant Portal"
        : userProfile?.role === "CUSTOMER"
          ? "My Orders"
          : "Login";

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center overflow-x-hidden text-center">
        <h1 className="animate-fade-in-up delay-100 mb-5 max-w-5xl text-5xl font-black tracking-tighter text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Trust, but{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Verify.
          </span>
        </h1>

        <p className="animate-fade-in-up delay-200 mb-10 max-w-3xl text-base font-light leading-7 tracking-tight text-slate-400 sm:text-lg md:text-xl lg:text-2xl">
          Sapphire is a tamper-resistant review integrity platform. It combines
          verified purchase eligibility, off-chain review storage, hash-linked
          lifecycle events, and blockchain audit anchoring.
        </p>

        <div className="animate-fade-in-up delay-300 mb-12 flex w-full max-w-3xl flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:mb-16">
          <SmoothLink
            href="/store"
            className="w-full rounded-full bg-white px-6 py-4 text-center font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-colors hover:bg-slate-200 sm:w-auto sm:px-8"
          >
            Start Demo Store
          </SmoothLink>

          {loading ? (
            <div className="w-full rounded-full bg-blue-600/60 px-6 py-4 text-center font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.25)] sm:w-auto sm:px-8">
              Loading...
            </div>
          ) : (
            <SmoothLink
              href={dashboardHref}
              className="w-full rounded-full bg-blue-600 px-6 py-4 text-center font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors hover:bg-blue-500 sm:w-auto sm:px-8"
            >
              {dashboardLabel}
            </SmoothLink>
          )}

          <SmoothLink
            href="/demo-flow"
            className="w-full rounded-full border border-white/10 bg-slate-800/80 px-6 py-4 text-center font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto sm:px-8"
          >
            View Walkthrough
          </SmoothLink>

          <SmoothLink
            href="/architecture"
            className="w-full rounded-full border border-white/10 bg-slate-800/80 px-6 py-4 text-center font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto sm:px-8"
          >
            Architecture
          </SmoothLink>
        </div>

        <div className="mx-auto mb-16 grid w-full max-w-6xl grid-cols-1 gap-5 text-left sm:gap-6 md:grid-cols-3 lg:gap-8">
          <div className="glass-panel min-w-0 rounded-3xl p-6 sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">
              1. Verified Experience
            </h3>

            <p className="text-sm font-light leading-relaxed text-slate-400">
              Customers cannot leave reviews without a cryptographically
              consumed Proof-of-Purchase token generated upon delivery.
            </p>
          </div>

          <div className="glass-panel min-w-0 rounded-3xl p-6 sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">
              2. Tamper-Evident Ledger
            </h3>

            <p className="text-sm font-light leading-relaxed text-slate-400">
              Sapphire does not force reviews to be permanently negative. It
              allows dispute resolution, but forces every edit, reply, or admin
              strike onto a public timeline.
            </p>
          </div>

          <div className="glass-panel min-w-0 rounded-3xl p-6 sm:p-8">
            <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">
              3. Blockchain Anchoring
            </h3>

            <p className="text-sm font-light leading-relaxed text-slate-400">
              Heavy review text is stored off-chain using IPFS. Only lightweight
              cryptographic proofs are anchored to the Polygon Amoy testnet.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}