"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getOrdersForCustomer,
  markOrderDelivered,
  markOrderShipped,
} from "@/lib/firebase/services/orderService";
import { getPoPTokenForOrder } from "@/lib/firebase/services/popTokenService";
import { getReviewForOrder } from "@/lib/firebase/services/reviewService";
import type { Order, PoPToken, Review, UserProfile } from "@/lib/types";
import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

type AuthUser = {
  uid: string;
  email?: string | null;
};

type EnrichedOrder = Order & {
  token: PoPToken | null;
  review: Review | null;
};

export default function CustomerOrdersPage() {
  const {
    currentUser,
    loading: authLoading,
  } = useAuth() as {
    currentUser: AuthUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
  };

  const [ordersData, setOrdersData] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOrdersAndContext = useCallback(async () => {
    if (authLoading) return;

    if (!currentUser?.uid) {
      setOrdersData([]);
      setLoading(false);
      setError("Please login as a customer to view your orders.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const orders = await getOrdersForCustomer(currentUser.uid);

      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const [token, review] = await Promise.all([
            getPoPTokenForOrder(order.id).catch(() => null),
            getReviewForOrder(order.id).catch(() => null),
          ]);

          return {
            ...order,
            token,
            review,
          };
        })
      );

      const sortedOrders = enrichedOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });

      setOrdersData(sortedOrders);
    } catch (err) {
      console.error("Could not load customer orders:", err);
      setError("Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, currentUser?.uid]);

  useEffect(() => {
    loadOrdersAndContext();
  }, [loadOrdersAndContext]);

  const handleDemoShip = async (orderId: string) => {
    if (!currentUser?.uid) return;

    try {
      setActionLoading(orderId);
      await markOrderShipped(orderId, currentUser.uid);
      await loadOrdersAndContext();
    } catch (err) {
      console.error("Could not mark order as shipped:", err);
      setError("Could not mark this order as shipped.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoDeliver = async (orderId: string) => {
    if (!currentUser?.uid) return;

    try {
      setActionLoading(orderId);
      await markOrderDelivered(orderId, currentUser.uid);
      await loadOrdersAndContext();
    } catch (err) {
      console.error("Could not mark order as delivered:", err);
      setError("Could not mark this order as delivered.");
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[45vh] items-center justify-center px-4 text-center text-white">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-2xl sm:px-10">
            <Loader2 className="animate-spin text-blue-500" size={36} />

            <p className="text-sm font-medium text-slate-300">
              Loading orders...
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden space-y-8">
        <header className="min-w-0">
          <h1 className="break-words text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            My Purchase History
          </h1>

          <p className="mt-4 max-w-2xl rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs leading-6 text-yellow-500">
            <strong>FYP Demo Mode:</strong> Delivery is usually managed by
            merchants. For this prototype, you can trigger shipping/delivery
            manually to test the PoP token activation.
          </p>
        </header>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        {ordersData.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/5 p-8 text-center shadow-xl sm:p-12 lg:p-16">
            <Package size={48} className="mx-auto mb-4 text-slate-700" />

            <h3 className="text-xl font-bold text-white">No orders found</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Once you buy a product, your proof-of-purchase and review
              eligibility will appear here.
            </p>

            <SmoothLink
              href="/store"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Browse Store
            </SmoothLink>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6">
            {ordersData.map((item) => {
              const isDelivered = item.status === "DELIVERED";
              const canReview =
                isDelivered &&
                item.token?.status === "ACTIVE" &&
                !item.review;

              const isBusy = actionLoading === item.id;

              return (
                <article
                  key={item.id}
                  className="glass-panel flex min-w-0 flex-col gap-6 rounded-2xl border border-white/5 p-5 shadow-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          isDelivered
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {item.status}
                      </span>

                      <span className="break-all font-mono text-xs text-slate-500">
                        Order #{item.id.slice(0, 8)}
                      </span>
                    </div>

                    <h3 className="break-all text-base font-bold text-white sm:text-lg">
                      Product ID: {item.productId.slice(0, 12)}...
                    </h3>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/5 bg-black/40 px-3 py-2">
                        <ShieldCheck
                          size={14}
                          className={
                            item.token?.status === "ACTIVE"
                              ? "shrink-0 text-blue-400"
                              : "shrink-0 text-slate-600"
                          }
                        />

                        <span className="break-words text-[10px] font-bold uppercase leading-5 text-slate-300">
                          {!isDelivered
                            ? "Locked Until Delivery"
                            : `PoP Token: ${item.token?.status || "Pending"}`}
                        </span>
                      </div>

                      {item.review && (
                        <SmoothLink
                          href={`/review/${item.review.id}/timeline`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-center sm:w-auto"
                        >
                          <CheckCircle size={14} className="text-green-400" />

                          <span className="text-[10px] font-bold uppercase leading-5 text-green-400">
                            View Verified Timeline
                          </span>
                        </SmoothLink>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
                    {(item.status === "PENDING" ||
                      item.status === "PROCESSING") && (
                      <button
                        type="button"
                        onClick={() => handleDemoShip(item.id)}
                        disabled={isBusy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        <Truck size={14} />
                        {isBusy ? "Updating..." : "Demo: Ship"}
                      </button>
                    )}

                    {!isDelivered && (
                      <button
                        type="button"
                        onClick={() => handleDemoDeliver(item.id)}
                        disabled={isBusy}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600/20 px-4 py-3 text-xs font-bold text-blue-400 transition hover:bg-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {isBusy ? "Updating..." : "Demo: Mark Delivered"}
                      </button>
                    )}

                    {canReview && (
                      <SmoothLink
                        href={`/review/submit/${item.id}`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 sm:w-auto"
                      >
                        Leave Verified Review
                      </SmoothLink>
                    )}

                    <SmoothLink
                      href={`/store/product/${item.productId}`}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-white/5 bg-slate-800 px-6 py-3 text-center text-sm font-bold text-slate-300 transition hover:bg-slate-700 sm:w-auto"
                    >
                      View Product
                    </SmoothLink>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}