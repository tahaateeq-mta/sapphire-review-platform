"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import RequireRole from '@/components/auth/RequireRole';
import { useAuth } from '@/components/providers/AuthProvider';
import { getProduct, updateProduct } from '@/lib/firebase/services/productService';
import { UserProfile, ProductStatus } from '@/lib/types';

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const router = useRouter();
  // Properly cast auth context to resolve UserProfile[cite: 1]
  const { userProfile } = useAuth() as { userProfile: UserProfile | null };
  const { productId } = React.use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aligned with the expanded Product interface
  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    category: 'Electronics',
    price: '', 
    stock: '0',
    imageUrl: '', 
    status: 'ACTIVE' as ProductStatus
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await getProduct(productId);
        
        if (!product) {
          setError("Product not found.");
        } else if (product.merchantUid !== userProfile?.uid) {
          setError("Permission denied. You do not own this product.");
        } else {
          // Standardize legacy statuses: INACTIVE or DELETED -> DISABLED
          let safeStatus = product.status as string; 
          if (safeStatus === 'INACTIVE' || safeStatus === 'DELETED') {
            safeStatus = 'DISABLED';
          }

          setFormData({
            name: product.name || '', 
            description: product.description || '',
            category: product.category || 'Electronics',
            price: (product.price || 0).toString(), 
            stock: (product.stock ?? 0).toString(),
            // Safe fallback for image field names[cite: 1, 8]
            imageUrl: product.imageUrl || product.image || '', 
            status: (safeStatus as ProductStatus) || 'ACTIVE'
          });
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("An error occurred while loading the product.");
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.uid) {
      loadProduct();
    }
  }, [productId, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Business logic validations
    if (formData.description.length < 20) return setError("Description must be at least 20 characters.");
    if (Number(formData.price) <= 0) return setError("Price must be greater than 0.");
    if (Number(formData.stock) < 0) return setError("Stock cannot be negative.");
    
    setSaving(true); 
    setError(null);
    
    try {
      // updateProduct implementation now enforces standard statuses and slugs[cite: 2, 8]
      await updateProduct(productId, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl.trim() || undefined,
        status: formData.status
      });
      router.push('/merchant/products');
    } catch (err: any) {
      setError(err.message || "Failed to update product.");
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 font-mono animate-pulse uppercase tracking-widest">Loading Ledger Data...</div>;

  return (
    <RequireRole allowedRoles={['MERCHANT']}>
      <PageTransition>
        <div className="max-w-3xl mx-auto w-full">
          <SmoothLink href="/merchant/products" className="text-slate-400 hover:text-white mb-6 inline-block transition-colors">&larr; Back to Products</SmoothLink>
          
          <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl">
            <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Edit Product</h1>
            
            {error ? (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">{error}</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Product Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={e=>setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Description (Min 20 chars)</label>
                    <textarea 
                      required 
                      minLength={20} 
                      rows={4} 
                      value={formData.description} 
                      onChange={e=>setFormData({...formData, description: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Category</label>
                    <select 
                      value={formData.category} 
                      onChange={e=>setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    >
                      {['Electronics', 'Accessories', 'Home', 'Fitness', 'Beauty', 'Gaming', 'Other'].map(cat => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e=>setFormData({...formData, status: e.target.value as ProductStatus})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="ACTIVE" className="bg-slate-900">Active (Public)</option>
                      <option value="DRAFT" className="bg-slate-900">Draft (Hidden)</option>
                      <option value="DISABLED" className="bg-slate-900">Disabled (Unavailable)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      required 
                      value={formData.price} 
                      onChange={e=>setFormData({...formData, price: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Stock Available</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={formData.stock} 
                      onChange={e=>setFormData({...formData, stock: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={formData.imageUrl} 
                      onChange={e=>setFormData({...formData, imageUrl: e.target.value})} 
                      placeholder="https://..." 
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30 uppercase tracking-widest text-sm"
                >
                  {saving ? "Updating Ledger..." : "Update Product"}
                </button>
              </form>
            )}
          </div>
        </div>
      </PageTransition>
    </RequireRole>
  );
}