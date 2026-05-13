"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SmoothLink from "../animations/SmoothLink";
import { useAuth } from "../providers/AuthProvider";

export default function Navbar() {
  const { userProfile, signOutUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  const handleBack = () => {
    closeMenu();

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    try {
      closeMenu();
      await signOutUser();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getDashboardLinks = (isMobile = false) => {
    const mobileLinkClass =
      "rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-white/5";
    const desktopLinkClass = "transition";

    if (userProfile?.role === "CUSTOMER") {
      return (
        <SmoothLink
          href="/customer/orders"
          onClick={closeMenu}
          className={
            isMobile
              ? `${mobileLinkClass} text-blue-400 hover:text-blue-300`
              : `${desktopLinkClass} text-blue-400 hover:text-blue-300`
          }
        >
          Dashboard
        </SmoothLink>
      );
    }

    if (userProfile?.role === "MERCHANT") {
      return (
        <>
          <SmoothLink
            href="/merchant/products"
            onClick={closeMenu}
            className={
              isMobile
                ? `${mobileLinkClass} text-cyan-400 hover:text-cyan-300`
                : `${desktopLinkClass} text-cyan-400 hover:text-cyan-300`
            }
          >
            Products
          </SmoothLink>

          <SmoothLink
            href="/merchant/dashboard"
            onClick={closeMenu}
            className={
              isMobile
                ? `${mobileLinkClass} text-blue-400 hover:text-blue-300`
                : `${desktopLinkClass} text-blue-400 hover:text-blue-300`
            }
          >
            Portal
          </SmoothLink>
        </>
      );
    }

    if (userProfile?.role === "ADMIN") {
      return (
        <>
          <SmoothLink
            href="/admin/merchants"
            onClick={closeMenu}
            className={
              isMobile
                ? `${mobileLinkClass} text-purple-400 hover:text-purple-300`
                : `${desktopLinkClass} text-purple-400 hover:text-purple-300`
            }
          >
            Merchants
          </SmoothLink>

          <SmoothLink
            href="/admin/dashboard"
            onClick={closeMenu}
            className={
              isMobile
                ? `${mobileLinkClass} text-blue-400 hover:text-blue-300`
                : `${desktopLinkClass} text-blue-400 hover:text-blue-300`
            }
          >
            Admin
          </SmoothLink>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#040b16]/85 backdrop-blur-3xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <SmoothLink
              href="/"
              onClick={closeMenu}
              className="group flex min-w-0 shrink-0 items-center gap-2 text-lg font-bold tracking-wide text-white sm:text-xl"
            >
              <ShieldCheck className="h-6 w-6 shrink-0 text-blue-500 transition-colors duration-500 group-hover:text-cyan-400" />
              <span className="truncate tracking-widest">SAPPHIRE</span>
            </SmoothLink>
          </div>

          <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
            <SmoothLink
              href="/store"
              className="text-slate-400 transition hover:text-white"
            >
              Store
            </SmoothLink>

            <SmoothLink
              href="/verify"
              className="text-slate-400 transition hover:text-white"
            >
              Verify
            </SmoothLink>

            <SmoothLink
              href="/demo-flow"
              className="text-slate-400 transition hover:text-white"
            >
              Demo Flow
            </SmoothLink>

            <SmoothLink
              href="/architecture"
              className="text-slate-400 transition hover:text-white"
            >
              Architecture
            </SmoothLink>

            {loading ? (
              <span className="ml-2 animate-pulse text-slate-500">
                Loading...
              </span>
            ) : userProfile ? (
              <div className="ml-2 flex items-center gap-4 border-l border-white/10 pl-4">
                <span className="max-w-[220px] truncate text-slate-300">
                  {userProfile.name}
                  <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                    {userProfile.role}
                  </span>
                </span>

                {getDashboardLinks(false)}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-red-400 transition hover:text-red-300"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-4 border-l border-white/10 pl-4">
                <SmoothLink
                  href="/login"
                  className="text-white transition hover:text-blue-400"
                >
                  Login
                </SmoothLink>

                <SmoothLink
                  href="/register"
                  className="rounded-full bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-500"
                >
                  Register
                </SmoothLink>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            {userProfile && !loading && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMenuOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={closeMenu}
        >
          <div
            className="absolute left-0 right-0 top-[73px] border-b border-white/10 bg-[#040b16]/95 px-4 pb-5 pt-3 shadow-2xl backdrop-blur-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-medium">
              <SmoothLink
                href="/store"
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Store
              </SmoothLink>

              <SmoothLink
                href="/verify"
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Verify
              </SmoothLink>

              <SmoothLink
                href="/demo-flow"
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Demo Flow
              </SmoothLink>

              <SmoothLink
                href="/architecture"
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Architecture
              </SmoothLink>

              <div className="mt-2 border-t border-white/10 pt-4">
                {loading ? (
                  <span className="block animate-pulse rounded-xl px-3 py-3 text-slate-500">
                    Loading...
                  </span>
                ) : userProfile ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl bg-white/5 px-3 py-3">
                      <p className="truncate text-sm font-semibold text-white">
                        {userProfile.name}
                      </p>

                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {userProfile.role}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl bg-white/[0.03] px-3 py-3">
                      {getDashboardLinks(true)}
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <SmoothLink
                      href="/login"
                      onClick={closeMenu}
                      className="rounded-xl px-3 py-3 text-white transition hover:bg-white/5 hover:text-blue-400"
                    >
                      Login
                    </SmoothLink>

                    <SmoothLink
                      href="/register"
                      onClick={closeMenu}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-500"
                    >
                      Register
                    </SmoothLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}