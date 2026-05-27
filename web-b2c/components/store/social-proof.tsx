const reviews = [
  {
    quote: "Perfect for game day. Got so many compliments at the match.",
    name: "Sarah M., Toronto",
    product: "Canada Cap",
  },
  {
    quote: "Shipped super fast. Quality is amazing for the price.",
    name: "James K., Vancouver",
    product: "Boxing Gloves",
  },
  {
    quote: "Love it. The whole family is geared up for 2026.",
    name: "Alex R., Montreal",
    product: "Car Flag Bundle",
  },
];

export function SocialProof() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A] mb-1">
            Fan Reviews
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Loved by Canadian Fans
          </h2>
        </div>

        <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="shrink-0 w-72 sm:w-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <p className="text-[#C41E3A] text-sm font-bold tracking-wide">★★★★★</p>
              <p className="mt-4 text-sm leading-6 text-gray-700">&quot;{review.quote}&quot;</p>
              <p className="mt-5 text-sm font-bold text-gray-900">{review.name}</p>
              <p className="mt-1 text-xs font-medium text-gray-400">{review.product}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
