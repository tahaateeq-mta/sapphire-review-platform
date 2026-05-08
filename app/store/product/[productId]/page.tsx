"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct } from "@/lib/firebase/services/productService";
import { getReviewsForProduct } from "@/lib/firebase/services/reviewService";
import { getRepliesForReviews } from "@/lib/firebase/services/merchantReplyService";
import { Product, Review, ReviewStatus, MerchantReply } from "@/lib/types";
import Link from "next/link";
import { Tag, Package, Image as ImageIcon, Star, MessageSquare } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [merchantReplies, setMerchantReplies] = useState<MerchantReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const productId = params?.productId as string;

      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        if (process.env.NEXT_PUBLIC_DATA_MODE === "firebase") {
          const prod = await getProduct(productId);
          setProduct(prod);

          if (prod) {
            const revs = await getReviewsForProduct(prod.id);
            setReviews(revs);

            const reviewIds = revs.map((review) => review.id);
            const replies = await getRepliesForReviews(reviewIds);
            setMerchantReplies(replies);
          }
        }
      } catch (error) {
        console.error("Error loading product detail data:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params?.productId]);

  if (loading) {
    return (
      <div className="p-20 text-white text-center font-mono animate-pulse uppercase tracking-widest">
        Accessing Ledger Record...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-20 text-red-500 text-center font-bold">
        CRITICAL ERROR: Product record not found in database.
      </div>
    );
  }

  if (product.status !== "ACTIVE") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-white/10 p-10 rounded-3xl max-w-lg text-center shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
            Product Unavailable
          </h2>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-sm font-medium">
            This item is currently {product.status.toLowerCase()} and cannot be purchased.
          </div>

          <button
            onClick={() => router.push("/store")}
            className="mt-8 bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-all font-bold text-sm"
          >
            &larr; Back to Store
          </button>
        </div>
      </div>
    );
  }

  const imageSrc = product.imageUrl || product.image || "";
  const category = product.category || "Uncategorized";
  const stock = product.stock ?? 0;

  const hiddenStatuses: ReviewStatus[] = ["STRICKEN", "WITHDRAWN", "ARCHIVED"];
  const visibleReviews = reviews.filter((review) => !hiddenStatuses.includes(review.status));

  const avgRating =
    visibleReviews.length > 0
      ? (
          visibleReviews.reduce((sum, review) => sum + review.rating, 0) /
          visibleReviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="p-8 text-white max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12 mb-16 bg-slate-900 p-10 rounded-3xl border border-white/5 shadow-2xl items-center">
        <div className="w-full md:w-2/5 bg-[#0a1220] rounded-2xl aspect-square flex items-center justify-center border border-white/5 overflow-hidden shrink-0 relative shadow-inner">
          {imageSrc ? (
            <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={64} className="text-slate-700 opacity-30" />
          )}

          <div className="absolute top-4 left-4 bg-blue-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter shadow-lg">
            Verified Item
          </div>
        </div>

        <div className="w-full md:w-3/5">
          <h1 className="text-5xl font-black mb-2 tracking-tighter uppercase">
            {product.name}
          </h1>

          <div className="text-3xl text-blue-400 font-black mb-6">
            ${(product.price || 0).toFixed(2)}
          </div>

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <Tag size={14} className="text-blue-500" />
              <span>{category}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <Package size={14} className={stock > 0 ? "text-green-500" : "text-red-500"} />
              <span className={stock > 0 ? "text-slate-300" : "text-red-500"}>
                {stock > 0 ? `${stock} units available` : "Sold Out"}
              </span>
            </div>
          </div>

          <p className="text-slate-400 mb-8 leading-relaxed font-light text-lg">
            {product.description || "No detailed specifications available."}
          </p>

          <div className="flex gap-6 items-center p-5 bg-black/40 rounded-2xl border border-white/5 w-max mb-10 shadow-lg">
            <div className="text-4xl font-black text-yellow-500 flex items-center gap-1">
              <Star size={28} fill="currentColor" />
              {avgRating}
            </div>

            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 border-l border-white/10 pl-6 space-y-1">
              <div>
                <span className="text-white text-lg">{reviews.length}</span> Total Logs
              </div>

              <div className="text-green-500">
                <span className="text-green-400">{visibleReviews.length}</span> Public Proofs
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/checkout/${product.id}`)}
            disabled={stock <= 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black py-5 px-12 rounded-2xl w-full md:w-max transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-sm"
          >
            {stock > 0 ? "Secure Purchase" : "Inventory Depleted"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          Verified Proof-of-Purchase Ledger
        </h2>
        <div className="h-px bg-white/10 flex-grow" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reviews.length === 0 ? (
          <div className="text-slate-600 italic p-16 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            No cryptographic evidence found for this product. Be the first to generate an entry.
          </div>
        ) : (
          reviews.map((review) => {
            const isHidden = hiddenStatuses.includes(review.status);
            const merchantReply = merchantReplies.find(
              (reply) => reply.reviewId === review.id
            );

            return (
              <div
                key={review.id}
                className={`glass-panel border rounded-3xl p-8 transition-all shadow-xl ${
                  isHidden
                    ? "border-red-500/20 bg-red-500/[0.02] opacity-60"
                    : "border-white/5 hover:border-blue-500/30"
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex text-yellow-500 gap-0.5">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            size={14}
                            fill={index < review.rating ? "currentColor" : "none"}
                            className={index < review.rating ? "" : "text-slate-700"}
                          />
                        ))}
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-green-500/10 text-green-400 border border-green-500/20">
                        ✓ Verified Transaction
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${
                          isHidden
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-slate-800 text-slate-400 border-white/5"
                        }`}
                      >
                        {review.status}
                      </span>
                    </div>

                    <h3 className="font-black text-xl uppercase tracking-tight">
                      {isHidden ? "Log Stricken from Public View" : review.title}
                    </h3>
                  </div>

                  <div className="text-left md:text-right font-mono">
                    <p className="text-[10px] text-slate-500 mb-1">
                      Actor: {review.userId.substring(0, 12)}...
                    </p>

                    <p className="text-[10px] text-cyan-400 bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/10">
                      SIG: {review.contentHash?.substring(0, 24)}...
                    </p>
                  </div>
                </div>

                <p
                  className={`text-base leading-relaxed ${
                    isHidden
                      ? "text-red-400/70 italic"
                      : "text-slate-400 font-light"
                  } mb-8`}
                >
                  {isHidden
                    ? `This record was ${review.status.toLowerCase()} by the customer or platform governance. Hash-chain data persists for audit.`
                    : review.content}
                </p>

                {merchantReply && (
                  <div className="mb-8 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={16} className="text-blue-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-blue-300">
                        Merchant Response
                      </p>
                    </div>

                    <p className="text-slate-200 text-sm leading-relaxed">
                      {merchantReply.content}
                    </p>

                    <div className="mt-4 flex flex-col gap-1 text-[10px] text-slate-500">
                      {merchantReply.contentHash && (
                        <p className="font-mono truncate">
                          Response Hash: {merchantReply.contentHash}
                        </p>
                      )}

                      <p>
                        Responded:{" "}
                        {merchantReply.createdAt
                          ? new Date(merchantReply.createdAt).toLocaleString()
                          : "Unknown date"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <Link
                    href={`/review/${review.id}/timeline`}
                    className="text-[10px] font-black text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 uppercase tracking-widest"
                  >
                    <span>Analyze Audit Chain &rarr;</span>
                  </Link>

                  <span className="text-[10px] text-slate-700 font-mono">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}