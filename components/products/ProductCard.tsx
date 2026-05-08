import React from 'react';
import SmoothLink from '../animations/SmoothLink';
import { Product } from '@/lib/types';
import { Star, Image as ImageIcon, Tag, Package } from 'lucide-react';

export default function ProductCard({ 
  product, 
  isFirebase = false,
  showAdminStatus = false 
}: { 
  product: Product, 
  isFirebase?: boolean,
  showAdminStatus?: boolean
}) {
  // Implementation of safe fallbacks for missing or legacy data
  const category = product.category || 'Uncategorized';
  const stock = product.stock ?? 0;
  const description = product.description || 'No description provided.';
  
  // Safe fallback for image field names to support legacy and updated schemas
  const imageSrc = product.imageUrl || product.image || "";

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col group hover:border-blue-500/30 transition-all duration-300 shadow-lg h-full bg-[#0a1220]/50 backdrop-blur-sm">
      {/* Visual Asset Container */}
      <div className="h-48 bg-[#0a1220] flex items-center justify-center relative overflow-hidden shrink-0 border-b border-white/5">
        {imageSrc ? (
           <img 
            src={imageSrc} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
           />
        ) : (
           <ImageIcon size={40} className="text-slate-700 opacity-40 group-hover:scale-110 transition-transform duration-700" />
        )}
        
        {/* Real-time Ledger & Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isFirebase && (
            <div className="bg-blue-600/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-black tracking-widest border border-white/10 uppercase">
              Verified Ledger
            </div>
          )}
          
          {/* Support for Repaired Product Statuses */}
          {product.status === 'DRAFT' && (
            <div className="bg-yellow-500/90 text-black text-[10px] px-2 py-1 rounded font-black tracking-widest uppercase">
              DRAFT
            </div>
          )}
          {product.status === 'DISABLED' && (
            <div className="bg-red-600/90 text-white text-[10px] px-2 py-1 rounded font-black tracking-widest uppercase">
              DISABLED
            </div>
          )}
          {(showAdminStatus && product.status === 'ACTIVE') && (
            <div className="bg-green-600/90 text-white text-[10px] px-2 py-1 rounded font-black tracking-widest uppercase">
              ACTIVE
            </div>
          )}
        </div>
      </div>
      
      {/* Item Meta-Data Container */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Title & Valuation */}
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className="text-xl font-black text-white truncate uppercase tracking-tighter" title={product.name}>
            {product.name}
          </h3>
          <span className="text-lg font-black text-blue-400 shrink-0 tabular-nums">
            ${(product.price || 0).toFixed(2)}
          </span>
        </div>

        {/* Inventory & Category Schemas[cite: 1, 12] */}
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
            <Tag size={12} className="text-blue-500" />
            <span className="truncate max-w-[100px]">{category}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
            <Package size={12} className={stock > 0 ? "text-green-500" : "text-red-500"} />
            <span className={stock > 0 ? "text-slate-400" : "text-red-500"}>
              {stock > 0 ? `${stock} Stock` : 'Sold Out'}
            </span>
          </div>
        </div>

        {/* Narrative Description[cite: 12] */}
        <p className="text-slate-400 text-sm font-light line-clamp-2 mb-6 flex-grow leading-relaxed">
          {description}
        </p>
        
        {/* Proof of Reputation Indicator[cite: 12] */}
        <div className="flex items-center gap-2 mb-8 bg-black/20 p-2 rounded-xl border border-white/5">
          <div className="flex text-yellow-500">
            <Star size={14} fill="currentColor" />
          </div>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {isFirebase ? 'Cryptographic Proof' : 'Demo Mode Active'}
          </span>
        </div>
        
        {/* Execution Actions[cite: 12] */}
        <div className="flex flex-col sm:flex-row gap-3 mt-auto">
          <SmoothLink 
            href={`/store/product/${product.id}`} 
            className="flex-1 bg-slate-800 text-center text-white py-3 rounded-xl hover:bg-slate-700 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
          >
            Inspect
          </SmoothLink>
          <SmoothLink 
            href={`/checkout/${product.id}`} 
            className="flex-1 bg-blue-600 text-center text-white py-3 rounded-xl hover:bg-blue-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/30"
          >
            Buy
          </SmoothLink>
        </div>
      </div>
    </div>
  );
}