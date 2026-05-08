"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProduct } from '@/lib/firebase/services/productService';
import { createOrder } from '@/lib/firebase/services/orderService';
import { Product, UserProfile } from '@/lib/types';
import PageTransition from '@/components/animations/PageTransition';
import { Loader2, CreditCard, Package, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  
  // Properly cast Auth context to include UserProfile[cite: 1]
  const { currentUser: user, userProfile } = useAuth() as { 
    currentUser: any; 
    userProfile: UserProfile | null 
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      const productId = params?.productId as string;
      if (!productId) return;
      
      try {
        const data = await getProduct(productId);
        if (!data) {
          setError("Product record not found.");
        } else if (data.status !== 'ACTIVE') {
          setError("This item is currently unavailable for purchase.");
        } else {
          setProduct(data);
        }
      } catch (err) {
        setError("Network error: Failed to sync product details.");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params?.productId]);

  const handlePlaceOrder = async () => {
    if (!user || !product) return;
    setProcessing(true);
    setError(null);

    try {
      // Updated CreateOrderInput matches the repaired service[cite: 4]
      await createOrder({
        userId: user.uid,
        customerName: userProfile?.name || 'Guest User',
        customerEmail: userProfile?.email || user.email,
        merchantId: product.merchantId,
        merchantUid: product.merchantUid,
        productId: product.id,
        price: product.price,
        quantity: 1,
        totalPrice: product.price,
      });

      // Redirect to the customer orders page upon success[cite: 11]
      router.push('/customer/orders');
    } catch (err: any) {
      setError(err.message || "Failed to secure transaction. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white font-mono animate-pulse">
        <Loader2 className="animate-spin mb-6 text-blue-500" size={48} />
        <p className="text-slate-400 uppercase tracking-widest text-xs">Finalizing Secure Session...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-black text-red-400 mb-4 uppercase tracking-tight">Access Denied</h2>
          <p className="text-slate-400 mb-8 font-light">{error || "The requested item is out of sync with the ledger."}</p>
          <button 
            onClick={() => router.push('/store')}
            className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all text-sm"
          >
            &larr; Return to Market
          </button>
        </div>
      </div>
    );
  }

  // Safe fallback for images[cite: 1]
  const imageSrc = product.imageUrl || product.image || "";

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            <CreditCard className="text-blue-500" size={32} /> Secure Checkout
          </h1>
          <div className="h-px bg-white/10 flex-grow ml-8 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Order Manifest */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-xl">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Package size={16} /> Transaction Manifest
              </h2>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-32 h-32 bg-black/40 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 shadow-inner shrink-0">
                  {imageSrc ? (
                    <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="text-slate-700" size={40} />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{product.name}</h3>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mt-1">{product.category}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-blue-400 font-black text-2xl">${(product.price || 0).toFixed(2)}</span>
                    <span className="text-slate-700 font-mono text-xs">/ UNIT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-blue-600/[0.02] shadow-xl">
              <h2 className="text-xs font-black text-green-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck size={18} /> Protocol: Proof-of-Purchase
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed font-light">
                Upon transaction finalization, the system will generate a <span className="text-white font-bold">PoP Token</span> uniquely bound to this Order ID and your User ID. This token serves as a cryptographic key, granting exclusive authorization to append a verified review to the immutable audit ledger.
              </p>
            </div>
          </div>

          {/* Settlement Sidebar */}
          <div className="space-y-8">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-blue-600/[0.05] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16"></div>
              <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tight">Settlement</h2>
              
              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-300">${product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <span>Network Fee</span>
                  <span className="text-green-500 font-black">0.00</span>
                </div>
                <div className="border-t border-white/10 pt-6 flex justify-between text-white font-black text-3xl tracking-tighter">
                  <span className="text-lg text-slate-500 self-center">TOTAL</span>
                  <span>${product.price.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/30 uppercase tracking-widest text-sm"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Securing Ledger...
                  </>
                ) : (
                  `Execute Payment`
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  End-to-End Encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}