"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  getOrdersForCustomer, 
  markOrderShipped, 
  markOrderDelivered 
} from "@/lib/firebase/services/orderService"; // Imports added[cite: 11]
import { getPoPTokenForOrder } from "@/lib/firebase/services/popTokenService";
import { getReviewForOrder } from "@/lib/firebase/services/reviewService";
import { Order, PoPToken, Review } from "@/lib/types";
import PageTransition from "@/components/animations/PageTransition";
import {
  Loader2,
  Package,
  MessageSquare,
  ShieldCheck,
  Clock,
  ShoppingBag,
  AlertCircle,
  Truck,
  CheckCircle
} from "lucide-react";
import SmoothLink from "@/components/animations/SmoothLink";

type EnrichedOrder = Order & {
  token: PoPToken | null;
  review: Review | null;
};

export default function CustomerOrdersPage() {
  const { currentUser, userProfile, loading: authLoading } = useAuth() as any;

  const [ordersData, setOrdersData] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Added for button state[cite: 11]
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
      const orders = await getOrdersForCustomer(currentUser.uid);
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const [token, review] = await Promise.all([
            getPoPTokenForOrder(order.id).catch(() => null),
            getReviewForOrder(order.id).catch(() => null),
          ]);
          return { ...order, token, review };
        })
      );
      setOrdersData(enrichedOrders.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ));
    } catch (err) {
      setError("Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, currentUser?.uid, userProfile]);

  useEffect(() => { loadOrdersAndContext(); }, [loadOrdersAndContext]);

  // Demo Handlers[cite: 11]
  const handleDemoShip = async (orderId: string) => {
    setActionLoading(orderId);
    await markOrderShipped(orderId, currentUser.uid);
    await loadOrdersAndContext();
    setActionLoading(null);
  };

  const handleDemoDeliver = async (orderId: string) => {
    setActionLoading(orderId);
    await markOrderDelivered(orderId, currentUser.uid);
    await loadOrdersAndContext();
    setActionLoading(null);
  };

  if (authLoading || loading) return <div className="flex items-center justify-center py-20 text-white gap-3"><Loader2 className="animate-spin" /> Loading orders...</div>;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">My Purchase History</h1>
          <p className="text-yellow-500 text-xs bg-yellow-500/10 p-3 rounded-xl mt-4 border border-yellow-500/20 max-w-2xl">
            <strong>FYP Demo Mode:</strong> Delivery is usually managed by merchants. For this prototype, you can trigger shipping/delivery manually to test the PoP token activation.[cite: 11]
          </p>
        </header>

        {ordersData.length === 0 ? (
          <div className="glass-panel p-20 rounded-3xl text-center"><Package size={48} className="mx-auto text-slate-700 mb-4" /><h3 className="text-xl font-bold text-white">No orders found</h3><SmoothLink href="/store" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Browse Store</SmoothLink></div>
        ) : (
          <div className="grid gap-6">
            {ordersData.map((item) => {
              const canReview = item.status === "DELIVERED" && item.token?.status === "ACTIVE" && !item.review;

              return (
                <div key={item.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                        item.status === "DELIVERED" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>{item.status}</span>
                      <span className="text-slate-500 text-xs font-mono">Order #{item.id.slice(0, 8)}</span>
                    </div>

                    <h3 className="text-white font-bold text-lg">Product ID: {item.productId.slice(0, 12)}...</h3>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
                        <ShieldCheck size={14} className={item.token?.status === "ACTIVE" ? "text-blue-400" : "text-slate-600"} />
                        <span className="text-[10px] text-slate-300 font-bold uppercase">
                          {item.status !== "DELIVERED" ? "Locked Until Delivery" : `PoP Token: ${item.token?.status || "Pending"}`}
                        </span>
                      </div>
                      {item.review && (
                        <SmoothLink href={`/review/${item.review.id}/timeline`} className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                          <CheckCircle size={14} className="text-green-400" />
                          <span className="text-[10px] text-green-400 font-bold uppercase">View Verified Timeline</span>
                        </SmoothLink>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    {/* Demo Control: Ship[cite: 11] */}
                    {(item.status === 'PENDING' || item.status === 'PROCESSING') && (
                      <button 
                        onClick={() => handleDemoShip(item.id)}
                        disabled={actionLoading === item.id}
                        className="px-4 py-2 bg-slate-800 text-white text-xs rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Truck size={14}/> {actionLoading === item.id ? "..." : "Demo: Ship"}
                      </button>
                    )}

                    {/* Demo Control: Deliver[cite: 11] */}
                    {item.status !== 'DELIVERED' && (
                      <button 
                        onClick={() => handleDemoDeliver(item.id)}
                        disabled={actionLoading === item.id}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 text-xs rounded-lg font-bold hover:bg-blue-600/30 disabled:opacity-50"
                      >
                        {actionLoading === item.id ? "..." : "Demo: Mark Delivered"}
                      </button>
                    )}

                    {/* Verified Review Link: FIXED ROUTE[cite: 11] */}
                    {canReview && (
                      <SmoothLink
                        href={`/review/submit/${item.id}`}
                        className="px-6 py-3 bg-blue-600 text-white text-sm rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                      >
                        Leave Verified Review
                      </SmoothLink>
                    )}

                    <SmoothLink href={`/store/product/${item.productId}`} className="px-6 py-3 bg-slate-800 text-slate-300 text-sm rounded-xl font-bold hover:bg-slate-700 border border-white/5">View Product</SmoothLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}