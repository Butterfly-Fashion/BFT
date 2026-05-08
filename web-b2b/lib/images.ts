export const PRODUCT_IMAGE_FALLBACK = "/images/product-placeholder.svg";

export function productImageSrc(imageUrl?: string | null) {
  if (!imageUrl) return PRODUCT_IMAGE_FALLBACK;
  return imageUrl;
}
