import Link from "next/link";
import { formatCAD } from "@/lib/money";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Image */}
      <div
        className="relative overflow-hidden rounded-xl aspect-square mb-3 shadow-sm"
        style={{ background: product.placeholderGradient }}
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          placeholderGradient={product.placeholderGradient}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#C41E3A] text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md">
              {product.badge}
            </span>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <span className="text-sm font-semibold text-gray-500">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">
          {product.category}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#C41E3A] transition-colors duration-150 leading-snug line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-sm font-bold text-gray-900">{formatCAD(product.price)}</span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatCAD(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
