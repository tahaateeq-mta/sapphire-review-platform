"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Package,
  ShieldCheck,
} from "lucide-react";

import PageTransition from "@/components/animations/PageTransition";
import { useAuth } from "@/components/providers/AuthProvider";
import { getProduct } from "@/lib/firebase/services/productService";
import { createOrder } from "@/lib/firebase/services/orderService";
import type { Product, UserProfile } from "@/lib/types";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const { currentUser: user, userProfile } = useAuth() as {
    currentUser: { uid: string; email?: string | null } | null;
    userProfile: UserProfile | null;
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productId =
    typeof params?.productId === "string" ? params.productId : "";

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productId) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getProduct(productId);

        if (!isMounted) return;

        if (!data) {
          setError("Product record not found.");
          setProduct(null);
          return;
        }

        if (data.status !== "ACTIVE") {
          setError("This item is currently unavailable for purchase.");
          setProduct(null);
          return;
        }

        if ((data.stock ?? 0) <= 0) {
          setError("This item is currently out of stock.");
          setProduct(null);
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error("Error loading checkout product:", err);

        if (!isMounted) return;

        setError("Network error: Failed to sync product details.");
        setProduct(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!product || processing) return;

    setProcessing(true);
    setError(null);

    try {
      await createOrder({
        userId: user.uid,
        customerName: userProfile?.name || "Guest User",
        customerEmail: userProfile?.email || user.email || "",
        merchantId: product.merchantId,
        merchantUid: product.merchantUid,
        productId: product.id,
        price: product.price,
        quantity: 1,
        totalPrice: product.price,
      });

      router.push("/customer/orders");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to secure transaction. Please try again.";

      setError(message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center font-mono text-white">
          <Loader2 className="mb-6 animate-spin text-blue-500" size={48} />

          <p className="animate-pulse text-xs uppercase tracking-[0.3em] text-slate-400">
            Finalizing Secure Session...
          </p>
        </div>
      </PageTransition>
    );
  }

  if (error || !product) {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-[55vh] max-w-md items-center justify-center px-4 py-10 text-center">
          <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/10 p-6 shadow-2xl sm:p-8">
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-red-400">
              Access Denied
            </h2>

            <p className="mb-8 text-sm font-light leading-6 text-slate-400">
              {error || "The requested item is out of sync with the ledger."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/store")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-700 sm:w-auto"
            >
              <ArrowLeft size={16} />
              Return to Market
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const imageSrc = product.imageUrl || product.image || "";
  const price = product.price || 0;

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-5xl overflow-x-hidden py-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-center md:justify-between">
          <h1 className="flex min-w-0 items-center gap-3 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            <CreditCard className="shrink-0 text-blue-500" size={30} />
            <span className="break-words">Secure Checkout</span>
          </h1>

          <div className="hidden h-px flex-grow bg-white/10 md:block" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10 xl:gap-12">
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            <div className="glass-panel rounded-3xl border border-white/5 p-5 shadow-xl sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                <Package size={16} />
                Transaction Manifest
              </h2>

              <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
                <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black/40 shadow-inner sm:w-32">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="text-slate-700" size={40} />
                  )}
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                  <h3 className="break-words text-2xl font-black uppercase tracking-tight text-white">
                    {product.name}
                  </h3>

                  <p className="mt-1 break-words text-sm font-bold uppercase tracking-wider text-slate-500">
                    {product.category || "Uncategorized"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <span className="text-2xl font-black text-blue-400">
                      ${price.toFixed(2)}
                    </span>

                    <span className="pb-1 font-mono text-xs text-slate-700">
                      / UNIT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 bg-blue-600/[0.02] p-5 shadow-xl sm:p-8">
              <h2 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-green-500 sm:mb-6">
                <ShieldCheck size={18} />
                Protocol: Proof-of-Purchase
              </h2>

              <p className="text-sm font-light leading-7 text-slate-400">
                Upon transaction finalization, the system will generate a{" "}
                <span className="font-bold text-white">PoP Token</span> uniquely
                bound to this Order ID and your User ID. This token serves as a
                cryptographic key, granting exclusive authorization to append a
                verified review to the immutable audit ledger.
              </p>
            </div>
          </div>

          <aside className="space-y-6 lg:space-y-8">
            <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/10 bg-blue-600/[0.05] p-5 shadow-2xl sm:p-8">
              <div className="absolute right-0 top-0 h-32 w-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16" />

              <h2 className="mb-8 text-xl font-black uppercase tracking-tight text-white">
                Settlement
              </h2>

              <div className="mb-8 space-y-5 sm:mb-10">
                <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-300">${price.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Network Fee</span>
                  <span className="font-black text-green-500">0.00</span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6 font-black text-white">
                  <span className="text-sm text-slate-500 sm:text-lg">
                    TOTAL
                  </span>

                  <span className="text-2xl tracking-tighter sm:text-3xl">
                    ${price.toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={processing}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/30 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Securing Ledger...
                  </>
                ) : (
                  "Execute Payment"
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  End-to-End Encrypted
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}