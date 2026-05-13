"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Hash,
  Image as ImageIcon,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
} from "lucide-react";

import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import { getDemoState } from "@/lib/demoStore";
import { getProduct } from "@/lib/firebase/services/productService";
import { getReviewsForProduct } from "@/lib/firebase/services/reviewService";
import { getRepliesForReviews } from "@/lib/firebase/services/merchantReplyService";
import type { MerchantReply, Product, Review, ReviewStatus } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [merchantReplies, setMerchantReplies] = useState<MerchantReply[]>([]);
  const [loading, setLoading] = useState(true);

  const isFirebase = process.env.NEXT_PUBLIC_DATA_MODE === "firebase";
  const productId = typeof params?.productId === "string" ? params.productId : "";

  useEffect(() => {
    let isMounted = true;

    async function loadProductDetail() {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (isFirebase) {
          const firestoreProduct = await getProduct(productId);

          if (!isMounted) return;

          setProduct(firestoreProduct);

          if (firestoreProduct) {
            const firestoreReviews = await getReviewsForProduct(
              firestoreProduct.id
            );

            if (!isMounted) return;

            setReviews(firestoreReviews);

            const reviewIds = firestoreReviews
              .map((review) => review.id)
              .filter(Boolean);

            if (reviewIds.length > 0) {
              const replies = await getRepliesForReviews(reviewIds);

              if (!isMounted) return;

              setMerchantReplies(replies);
            } else {
              setMerchantReplies([]);
            }
          } else {
            setReviews([]);
            setMerchantReplies([]);
          }

          return;
        }

        const demoState = getDemoState();
        const demoProduct =
          demoState.products.find((item) => item.id === productId) ?? null;

        const demoReviews = demoState.reviews.filter(
          (review) => review.productId === productId
        );

        if (!isMounted) return;

        setProduct(demoProduct);
        setReviews(demoReviews);
        setMerchantReplies([]);
      } catch (error) {
        console.error("Error loading product detail data:", error);

        if (!isMounted) return;

        setProduct(null);
        setReviews([]);
        setMerchantReplies([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProductDetail();

    return () => {
      isMounted = false;
    };
  }, [isFirebase, productId]);

  const hiddenStatuses: ReviewStatus[] = useMemo(
    () => ["STRICKEN", "WITHDRAWN", "ARCHIVED"],
    []
  );

  const visibleReviews = useMemo(() => {
    return reviews.filter((review) => !hiddenStatuses.includes(review.status));
  }, [hiddenStatuses, reviews]);

  const avgRating = useMemo(() => {
    if (visibleReviews.length === 0) return "0.0";

    const totalRating = visibleReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return (totalRating / visibleReviews.length).toFixed(1);
  }, [visibleReviews]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-2xl sm:px-10">
            <p className="animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
              Accessing Ledger Record...
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!product) {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 shadow-2xl sm:p-10">
            <h1 className="mb-3 text-2xl font-black uppercase tracking-tight text-white">
              Product Not Found
            </h1>

            <p className="mb-8 text-sm leading-6 text-red-200/80">
              This product record could not be found in the current data source.
            </p>

            <button
              type="button"
              onClick={() => router.push("/store")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back to Store
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const imageSrc = product.imageUrl || product.image || "";
  const category = product.category || "Uncategorized";
  const stock = product.stock ?? 0;
  const status = product.status || "ACTIVE";
  const isAvailable = status === "ACTIVE" && stock > 0;

  if (status !== "ACTIVE") {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl sm:p-10">
            <h1 className="mb-4 text-2xl font-black uppercase tracking-tight text-white">
              Product Unavailable
            </h1>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm font-medium leading-6 text-yellow-400">
              This item is currently {status.toLowerCase()} and cannot be
              purchased.
            </div>

            <button
              type="button"
              onClick={() => router.push("/store")}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
              Back to Store
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden text-white">
        <button
          type="button"
          onClick={() => router.push("/store")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Store
        </button>

        <section className="mb-12 grid grid-cols-1 gap-8 rounded-3xl border border-white/5 bg-slate-900 p-5 shadow-2xl sm:p-6 lg:mb-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-10">
          <div className="relative flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-[#0a1220] shadow-inner">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon size={64} className="text-slate-700 opacity-40" />
            )}

            <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-white shadow-lg">
              <ShieldCheck size={12} />
              Verified Item
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="mb-3 break-words text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <div className="mb-6 text-2xl font-black text-blue-400 sm:text-3xl">
              ${(product.price || 0).toFixed(2)}
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <Tag size={14} className="shrink-0 text-blue-500" />
                <span className="truncate">{category}</span>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <Package
                  size={14}
                  className={stock > 0 ? "shrink-0 text-green-500" : "shrink-0 text-red-500"}
                />
                <span className={stock > 0 ? "truncate text-slate-300" : "truncate text-red-500"}>
                  {stock > 0 ? `${stock} units available` : "Sold Out"}
                </span>
              </div>
            </div>

            <p className="mb-8 break-words text-base font-light leading-7 text-slate-400 sm:text-lg">
              {product.description || "No detailed specifications available."}
            </p>

            <div className="mb-8 flex w-full flex-col gap-4 rounded-2xl border border-white/5 bg-black/40 p-5 shadow-lg sm:w-fit sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2 text-3xl font-black text-yellow-500 sm:text-4xl">
                <Star size={28} fill="currentColor" />
                {avgRating}
              </div>

              <div className="space-y-1 border-t border-white/10 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <div>
                  <span className="text-lg text-white">{reviews.length}</span>{" "}
                  Total Logs
                </div>

                <div className="text-green-500">
                  <span className="text-green-400">
                    {visibleReviews.length}
                  </span>{" "}
                  Public Proofs
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/checkout/${product.id}`)}
              disabled={!isAvailable}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 sm:w-fit sm:px-12"
            >
              <ShoppingCart size={18} />
              {stock > 0 ? "Secure Purchase" : "Inventory Depleted"}
            </button>
          </div>
        </section>

        <section>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              Verified Proof-of-Purchase Ledger
            </h2>
            <div className="hidden h-px flex-grow bg-white/10 sm:block" />
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] p-8 text-center text-sm italic leading-6 text-slate-600 sm:p-12 lg:p-16">
              No cryptographic evidence found for this product. Be the first to
              generate an entry.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {reviews.map((review) => {
                const isHidden = hiddenStatuses.includes(review.status);
                const merchantReply = merchantReplies.find(
                  (reply) => reply.reviewId === review.id
                );

                return (
                  <article
                    key={review.id}
                    className={`glass-panel min-w-0 rounded-3xl border p-5 shadow-xl transition-all sm:p-6 lg:p-8 ${
                      isHidden
                        ? "border-red-500/20 bg-red-500/[0.02] opacity-70"
                        : "border-white/5 hover:border-blue-500/30"
                    }`}
                  >
                    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <div className="flex shrink-0 gap-0.5 text-yellow-500">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                size={14}
                                fill={
                                  index < review.rating
                                    ? "currentColor"
                                    : "none"
                                }
                                className={
                                  index < review.rating ? "" : "text-slate-700"
                                }
                              />
                            ))}
                          </div>

                          <span className="rounded border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-green-400">
                            ✓ Verified Transaction
                          </span>

                          <span
                            className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${
                              isHidden
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : "border-white/5 bg-slate-800 text-slate-400"
                            }`}
                          >
                            {review.status}
                          </span>
                        </div>

                        <h3 className="break-words text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                          {isHidden
                            ? "Log Stricken from Public View"
                            : review.title}
                        </h3>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-white/5 bg-black/20 p-3 font-mono md:max-w-[280px] md:text-right">
                        <p className="mb-2 break-all text-[10px] text-slate-500">
                          Actor: {review.userId?.substring(0, 12) || "unknown"}
                          ...
                        </p>

                        <p className="break-all rounded-full border border-cyan-500/10 bg-cyan-900/20 px-3 py-1 text-[10px] text-cyan-400">
                          SIG: {review.contentHash?.substring(0, 24) || "pending"}
                          ...
                        </p>
                      </div>
                    </div>

                    <p
                      className={`mb-6 break-words text-sm leading-7 sm:text-base ${
                        isHidden
                          ? "text-red-400/70 italic"
                          : "font-light text-slate-400"
                      }`}
                    >
                      {isHidden
                        ? `This record was ${review.status.toLowerCase()} by the customer or platform governance. Hash-chain data persists for audit.`
                        : review.content}
                    </p>

                    <div className="mb-6 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      <div className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <Hash size={12} className="shrink-0 text-blue-400" />
                        <span className="break-all">
                          {review.contentHash || "Hash pending"}
                        </span>
                      </div>
                    </div>

                    {merchantReply && (
                      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-300">
                          <MessageSquare size={14} />
                          Merchant Reply
                        </div>

                        <p className="break-words text-sm leading-6 text-slate-300">
                          {merchantReply.content}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Review ID:{" "}
                        <span className="font-mono break-all text-slate-400">
                          {review.id}
                        </span>
                      </p>

                      <SmoothLink
                        href={`/review/${review.id}/timeline`}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
                      >
                        View Timeline
                      </SmoothLink>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}