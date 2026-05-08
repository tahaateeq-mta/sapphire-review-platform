"use client";
import React, { useEffect, useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import { getDemoState } from '@/lib/demoStore';
import { getActiveProducts } from '@/lib/firebase/services/productService';
import { Product } from '@/lib/types';
import { ShoppingBag, Star, Image as ImageIcon } from 'lucide-react';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirebase = process.env.NEXT_PUBLIC_DATA_MODE === 'firebase';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (isFirebase) {
          // Utilizes the standardized getter from productService.ts
          const firestoreProducts = await getActiveProducts();
          setProducts(firestoreProducts);
        } else {
          setProducts(getDemoState().products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isFirebase]);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Demo Store</h1>
            <p className="text-slate-400 font-light">Purchase products to unlock verified review eligibility.</p>
          </div>
          {isFirebase && (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold font-mono">
              Live Firestore Mode
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-mono animate-pulse uppercase tracking-widest">
            Fetching Market Data...
          </div>
        ) : products.length === 0 ? (
          <div className="glass-panel p-16 text-center rounded-3xl border border-white/5 shadow-xl">
            <ShoppingBag size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Products</h3>
            <p className="text-slate-400">Ask an admin to create a merchant account, login as the merchant, and add products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map(product => {
              // Implementation of the safe fallback for product images
              const imageSrc = product.imageUrl || product.image || "";
              
              return (
                <div key={product.id} className="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col group hover:border-blue-500/30 transition-all duration-300 shadow-lg">
                  <div className="h-48 bg-[#0a1220] flex items-center justify-center relative overflow-hidden border-b border-white/5">
                    {imageSrc ? (
                       <img 
                        src={imageSrc} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                       />
                    ) : (
                       <ImageIcon size={40} className="text-slate-700 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    {isFirebase && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold font-mono uppercase tracking-tighter">
                        Verified Ledger
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white truncate pr-2">{product.name}</h3>
                      <span className="text-lg font-black text-blue-400">${(product.price || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-slate-400 text-sm font-light line-clamp-2 mb-4 flex-grow">{product.description}</p>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex text-yellow-500"><Star size={14} fill="currentColor" /></div>
                      <span className="text-xs text-slate-500 font-medium">
                        {isFirebase ? 'Verify proof-of-purchase' : 'Mock reviews loaded'}
                      </span>
                    </div>
                    <SmoothLink 
                      href={`/store/product/${product.id}`} 
                      className="w-full bg-slate-800 text-center text-white py-3 rounded-xl hover:bg-slate-700 transition-all font-bold text-sm border border-white/5"
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