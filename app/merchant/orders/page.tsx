"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getOrdersForMerchant, updateOrderStatus } from '@/lib/firebase/services/orderService';
import { Order } from '@/lib/types';
import PageTransition from '@/components/animations/PageTransition';
import { Loader2, Package, Truck, CheckCircle, ExternalLink } from 'lucide-react';
import SmoothLink from '@/components/animations/SmoothLink';

export default function MerchantOrdersPage() {
  const { userProfile } = useAuth() as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    if (userProfile?.merchantId) {
      try {
        const data = await getOrdersForMerchant(userProfile.merchantId);
        // Sort by newest first
        setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error("Failed to load merchant orders:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [userProfile]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Refresh list
    } catch (err) {
      alert("Failed to update order status.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-white gap-3">
      <Loader2 className="animate-spin text-blue-500" /> Loading incoming orders...
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header>
          <h1 className="text-4xl font-black text-white">Order Management</h1>
          <p className="text-slate-400 mt-2">Track shipments and update delivery status for your customers.</p>
        </header>

        {orders.length === 0 ? (
          <div className="glass-panel p-20 rounded-3xl border border-white/5 text-center">
            <Package size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
            <p className="text-slate-400">When customers purchase your products, they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/10 transition"
              >
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                      order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">#{order.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-white font-bold">Product ID: {order.productId.slice(0, 12)}...</h3>
                  <p className="text-slate-400 text-xs mt-1">Customer UID: {order.userId.slice(0, 12)}...</p>
                  <p className="text-slate-500 text-[10px] mt-2 uppercase">{new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                      disabled={actionLoading === order.id}
                      className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 text-white text-xs rounded-xl font-bold hover:bg-blue-500 transition flex items-center gap-2"
                    >
                      {actionLoading === order.id ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                      Mark Shipped
                    </button>
                  )}

                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={actionLoading === order.id}
                      className="flex-1 md:flex-none px-4 py-2.5 bg-green-600 text-white text-xs rounded-xl font-bold hover:bg-green-500 transition flex items-center gap-2"
                    >
                      {actionLoading === order.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Mark Delivered
                    </button>
                  )}

                  <SmoothLink 
                    href={`/merchant/orders/${order.id}`}
                    className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-white/5 transition"
                  >
                    <ExternalLink size={18} />
                  </SmoothLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}