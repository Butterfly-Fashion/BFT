"use client";

import { PRODUCT_IMAGE_FALLBACK, productImageSrc } from "@/lib/images";

type ProductImageProps = {
  alt: string;
  className: string;
  src?: string | null;
};

export function ProductImage({ alt, className, src }: ProductImageProps) {
  return (
    <img
      alt={alt}
      className={className}
      src={productImageSrc(src)}
      onError={(event) => {
        event.currentTarget.src = PRODUCT_IMAGE_FALLBACK;
      }}
    />
  );
}
