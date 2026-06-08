import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="text-brand font-semibold text-sm uppercase tracking-widest mb-4">404</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Page not found</h1>
      <p className="text-gray-500 text-sm mb-10">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/products"
        className="inline-flex items-center justify-center px-8 py-3.5 bg-brand text-white font-semibold rounded-full hover:bg-brand-hover transition-colors text-sm"
      >
        Back to Shop
      </Link>
    </div>
  );
}
