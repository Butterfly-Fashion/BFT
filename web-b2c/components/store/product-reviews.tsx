"use client";

import { useState } from "react";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  created_at: string;
}

function Stars({
  rating,
  interactive = false,
  onSelect,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onSelect?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
          aria-label={interactive ? `Rate ${star} out of 5` : undefined}
        >
          <svg
            className={`h-4 w-4 ${(hovered || rating) >= star ? "text-yellow-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productSlug, onSubmitted }: { productSlug: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Please select a star rating.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_slug: productSlug, author_name: name, rating, body }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      onSubmitted();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">
        Thank you for your review.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Your rating</p>
        <Stars rating={rating} interactive onSelect={setRating} />
      </div>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      <textarea
        placeholder="Share your experience (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-[#a31830] disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="border-b border-gray-100 pb-5 last:border-0">
      <div className="mb-2 flex items-center gap-3">
        <Stars rating={review.rating} />
        <span className="text-sm font-semibold text-gray-800">{review.author_name}</span>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
      {review.body && <p className="text-sm leading-relaxed text-gray-600">{review.body}</p>}
    </div>
  );
}

function EmptyReviewConfidence() {
  return (
    <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600 sm:grid-cols-3">
      <div>
        <p className="font-bold text-gray-900">In stock locally</p>
        <p className="mt-1 text-xs leading-5">Pickup is available at 178 Bentworth Ave in North York.</p>
      </div>
      <div>
        <p className="font-bold text-gray-900">Clear item count</p>
        <p className="mt-1 text-xs leading-5">Panini 50-pack boxes include 350 stickers total.</p>
      </div>
      <div>
        <p className="font-bold text-gray-900">Secure payment</p>
        <p className="mt-1 text-xs leading-5">Checkout runs through Stripe with email confirmation.</p>
      </div>
    </div>
  );
}

export function ProductReviews({
  productSlug,
  initialReviews,
}: {
  productSlug: string;
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);

  async function refreshReviews() {
    try {
      const res = await fetch(`/api/reviews?slug=${productSlug}`);
      if (res.ok) setReviews(await res.json());
    } catch {
      // Silent refresh failure keeps the submitted thank-you state visible.
    }
    setShowForm(false);
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Customer Reviews</h2>
          {avg ? (
            <div className="mt-1 flex items-center gap-2">
              <Stars rating={Math.round(Number(avg))} />
              <span className="text-sm text-gray-500">
                {avg} out of 5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Verified buyer reviews are collected after purchase.
            </p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="mb-4 text-base font-bold text-gray-900">Write a Review</h3>
          <ReviewForm productSlug={productSlug} onSubmitted={refreshReviews} />
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyReviewConfidence />
      ) : (
        <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
