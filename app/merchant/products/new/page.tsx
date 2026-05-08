"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/animations/PageTransition';
import SmoothLink from '@/components/animations/SmoothLink';
import RequireRole from '@/components/auth/RequireRole';
import { useAuth } from '@/components/providers/AuthProvider';
import { createProduct, CreateProductInput } from '@/lib/firebase/services/productService';
import { UserProfile } from '@/lib/types';

export default function NewProductPage() {
  const router = useRouter();
  // Fixed: Cast useAuth to include the UserProfile type
  const { userProfile } = useAuth() as { userProfile: UserProfile | null };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    category: 'Electronics', 
    price: '', 
    stock: '10', 
    imageUrl: '', 
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety checks for the merchant profile[cite: 1, 7]
    if (!userProfile?.uid) return setError("User session missing.");
    if (!userProfile?.merchantId) return setError("Merchant ID missing. Your merchant profile is incomplete.");
    
    // Validation
    if (formData.description.length < 20) return setError("Description must be at least 20 characters.");
    if (Number(formData.price) <= 0) return setError("Price must be greater than 0.");
    if (Number(formData.stock) < 0) return setError("Stock cannot be negative.");
    
    setLoading(true); 
    setError(null);
    
    try {
      // Map strictly to our repaired CreateProductInput type[cite: 2, 7]
      const newProduct: CreateProductInput = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl.trim() || undefined,
        status: formData.status,
        merchantId: userProfile.merchantId,
        merchantUid: userProfile.uid
      };

      await createProduct(newProduct);
      router.push('/merchant/products');
    } catch (err: any) {
      setError(err.message || "Failed to create product.");
      setLoading(false);
    }
  };

  return (
    <RequireRole allowedRoles={['MERCHANT']}>
      <PageTransition>
        <div className="max-w-3xl mx-auto w-full">
          <SmoothLink href="/merchant/products" className="text-slate-400 hover:text-white mb-6 inline-block">
            &larr; Back to Products
          </SmoothLink>
          <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl">
            <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Add New Product</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Product Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
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
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  >
                    {['Electronics', 'Accessories', 'Home', 'Fitness', 'Beauty', 'Gaming', 'Other'].map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Initial Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE'|'DRAFT'})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="ACTIVE" className="bg-slate-900">Active (Public)</option>
                    <option value="DRAFT" className="bg-slate-900">Draft (Hidden)</option>
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
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Initial Stock</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.imageUrl} 
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                    placeholder="https://..." 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-colors" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30 uppercase tracking-widest text-sm"
              >
                {loading ? "Processing Ledger..." : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      </PageTransition>
    </RequireRole>
  );
}