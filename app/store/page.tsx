"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import { getDemoState } from "@/lib/demoStore";
import { getActiveProducts } from "@/lib/firebase/services/productService";
import { Product } from "@/lib/types";
import { Image as ImageIcon, ShoppingBag, Star } from "lucide-react";

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const isFirebase = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        if (isFirebase) {
          const firestoreProducts = await getActiveProducts();
          setProducts(firestoreProducts);
        } else {
          setProducts(getDemoState().products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isFirebase]);

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="mb-2 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              Demo Store
            </h1>

            <p className="max-w-2xl text-sm font-light leading-6 text-slate-400 sm:text-base">
              Purchase products to unlock verified review eligibility.
            </p>
          </div>

          {isFirebase && (
            <span className="w-fit rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 font-mono text-xs font-bold text-blue-400">
              Live Firestore Mode
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-4 py-20 text-center font-mono text-sm uppercase tracking-widest text-slate-400 animate-pulse">
            Fetching Market Data...
          </div>
        ) : products.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/5 p-8 text-center shadow-xl sm:p-12 md:p-16">
            <ShoppingBag
              size={48}
              className="mx-auto mb-4 text-slate-600"
            />

            <h3 className="mb-2 text-xl font-bold text-white">
              No Active Products
            </h3>

            <p className="mx-auto max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Ask an admin to create a merchant account, login as the merchant,
              and add products.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {products.map((product) => {
              const imageSrc = product.imageUrl || product.image || "";

              return (
                <div
                  key={product.id}
                  className="glass-panel group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/5 shadow-lg transition-all duration-300 hover:border-blue-500/30"
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-white/5 bg-[#0a1220] sm:h-48">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={product.name || "Product image"}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImageIcon
                        size={40}
                        className="text-slate-700 opacity-50 transition-transform duration-500 group-hover:scale-110"
                      />
                    )}

                    {isFirebase && (
                      <div className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-tighter text-white backdrop-blur">
                        Verified Ledger
                      </div>
                    )}
                  </div>

                  <div className="flex flex-grow flex-col p-5 sm:p-6">
                    <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-lg font-bold text-white sm:text-xl">
                        {product.name}
                      </h3>

                      <span className="shrink-0 text-base font-black text-blue-400 sm:text-lg">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                    </div>

                    <p className="mb-4 line-clamp-2 flex-grow text-sm font-light leading-6 text-slate-400">
                      {product.description || "No description available."}
                    </p>

                    <div className="mb-6 flex min-w-0 items-center gap-2">
                      <div className="flex shrink-0 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                      </div>

                      <span className="min-w-0 truncate text-xs font-medium text-slate-500">
                        {isFirebase
                          ? "Verify proof-of-purchase"
                          : "Mock reviews loaded"}
                      </span>
                    </div>

                    <SmoothLink
                      href={`/store/product/${product.id}`}
                      className="w-full rounded-xl border border-white/5 bg-slate-800 px-4 py-3 text-center text-sm font-bold text-white transition-all hover:bg-slate-700"
                    >
                      View Details
                    </SmoothLink>
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