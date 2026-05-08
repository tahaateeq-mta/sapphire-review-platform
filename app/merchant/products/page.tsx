"use client";
import React, { useEffect, useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import RequireRole from '@/components/auth/RequireRole';
import { useAuth } from '@/components/providers/AuthProvider';
import { getMerchantProducts, updateProduct } from '@/lib/firebase/services/productService';
import { Product, UserProfile } from '@/lib/types';
import { Package, Plus, Edit, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function MerchantProductsPage() {
  // Correctly type the userProfile from useAuth
  const { userProfile } = useAuth() as { userProfile: UserProfile | null };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadProducts = async () => {
    // Prefer merchantUid if available, otherwise fallback to merchantId/uid
    const merchantId = userProfile?.merchantId || userProfile?.uid;
    if (!merchantId) return;

    try {
      const data = await getMerchantProducts(merchantId);
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      loadProducts();
    }
  }, [userProfile]);

  const handleStatusChange = async (productId: string, newStatus: 'ACTIVE' | 'DISABLED') => {
    setActionLoading(productId);
    try {
      // updateProduct implementation now enforces standard statuses[cite: 2]
      await updateProduct(productId, { status: newStatus });
      await loadProducts(); // Refresh list to reflect changes
    } catch (err) {
      alert("Failed to update product status.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <RequireRole allowedRoles={['MERCHANT']}>
      <PageTransition>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white">My Products</h1>
              <p className="text-slate-400 mt-2">Manage your inventory and product visibility</p>
            </div>
            <SmoothLink 
              href="/merchant/products/new" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
            >
              <Plus size={20} />
              Add Product
            </SmoothLink>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="text-blue-500 animate-spin" size={40} />
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel p-20 rounded-3xl border border-white/5 text-center">
              <Package size={48} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
              <p className="text-slate-400 mb-8">Start by adding your first product to the store.</p>
              <SmoothLink href="/merchant/products/new" className="text-blue-400 font-bold hover:underline">
                Create your first product &rarr;
              </SmoothLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => {
                // Use safe fallback for product images
                const imageSrc = product.imageUrl || product.image || "";
                
                return (
                  <div 
                    key={product.id} 
                    className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                        {imageSrc ? (
                          <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-slate-700" size={24} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{product.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-blue-400 font-black">${(product.price || 0).toFixed(2)}</span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            product.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 
                            product.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-400' : 
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {product.status}
                          </span>
                          <span className="text-slate-600 text-xs">•</span>
                          <span className="text-slate-500 text-xs">{product.stock || 0} in stock</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      {product.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(product.id, 'DISABLED')}
                          disabled={actionLoading === product.id}
                          className="p-3 bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition flex items-center gap-2 text-sm font-medium border border-white/5"
                          title="Disable Product"
                        >
                          {actionLoading === product.id ? <Loader2 size={18} className="animate-spin" /> : <EyeOff size={18} />}
                          <span className="md:hidden lg:inline">Disable</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(product.id, 'ACTIVE')}
                          disabled={actionLoading === product.id}
                          className="p-3 bg-slate-800 text-slate-400 hover:text-green-400 rounded-xl transition flex items-center gap-2 text-sm font-medium border border-white/5"
                          title="Activate Product"
                        >
                          {actionLoading === product.id ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                          <span className="md:hidden lg:inline">Activate</span>
                        </button>
                      )}
                      
                      <SmoothLink 
                        href={`/merchant/products/${product.id}/edit`}
                        className="p-3 bg-slate-800 text-slate-400 hover:text-blue-400 rounded-xl transition flex items-center gap-2 text-sm font-medium border border-white/5"
                      >
                        <Edit size={18} />
                        <span className="md:hidden lg:inline">Edit</span>
                      </SmoothLink>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </RequireRole>
  );
}