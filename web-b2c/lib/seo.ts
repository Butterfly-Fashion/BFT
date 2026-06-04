import type { Product } from "@/lib/types";

export const SITE_URL = "https://fifa2026.ca";
export const SITE_NAME = "World Fan Gear";
export const BUSINESS_NAME = "Butterfly Fashion Trading";
export const BUSINESS_STREET_ADDRESS = "178 Bentworth Ave";
export const BUSINESS_LOCALITY = "North York";
export const BUSINESS_REGION = "ON";
export const BUSINESS_POSTAL_CODE = "M6A 1P7";
export const BUSINESS_COUNTRY = "CA";
export const BUSINESS_EMAIL = "jameskimkim1@gmail.com";
export const BUSINESS_PHONE = "+1-416-785-5999";
export const AEO_STORE_DESCRIPTION =
  "fifa2026.ca is a Toronto-based online and local store for World Cup 2026 flags, hats, jerseys, stickers, car flags, scarves, and fan accessories, with Canada-wide delivery.";

export interface ProductReviewJsonLdInput {
  author_name: string;
  rating: number;
  body: string | null;
  created_at: string;
}

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function productSeoTitle(product: Product): string {
  return `${product.name} | Canada 2026 Fan Gear`;
}

export function productSeoDescription(product: Product): string {
  return `Shop ${product.name} from World Fan Gear, a Toronto-based World Cup 2026 merchandise store shipping fan gear across Canada.`;
}

export function productJsonLd(product: Product, reviews: ProductReviewJsonLdInput[] = []) {
  const images = [absoluteUrl(product.imageUrl)];
  if (product.additionalImages?.length) {
    images.push(...product.additionalImages.map(absoluteUrl));
  }
  const validReviews = reviews.filter(
    (review) => review.rating >= 1 && review.rating <= 5 && review.author_name.trim()
  );
  const ratingValue = validReviews.length
    ? validReviews.reduce((sum, review) => sum + review.rating, 0) / validReviews.length
    : null;

  const productJson = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productSeoDescription(product),
    image: images,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category,
    sku: product.slug,
    mpn: product.slug,
    url: absoluteUrl(`/products/${product.slug}`),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "CAD",
      price: (product.price ?? 0).toFixed(2),
      priceValidUntil: "2026-12-31",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BUSINESS_NAME,
        url: SITE_URL,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "CAD",
          minValue: "0",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "CA",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "CA",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  if (ratingValue) {
    Object.assign(productJson, {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ratingValue.toFixed(1),
        reviewCount: validReviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: validReviews.slice(0, 10).map((review) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: review.author_name,
        },
        datePublished: review.created_at.slice(0, 10),
        reviewBody: review.body ?? undefined,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    });
  }

  return productJson;
}

export function itemListJsonLd(
  name: string,
  url: string,
  items: Array<{ slug: string; name: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(url),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${item.slug}`),
      name: item.name,
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: BUSINESS_NAME,
    alternateName: [SITE_NAME, "Butterfly Fashion"],
    url: SITE_URL,
    logo: absoluteUrl("/asset/logo.jpg"),
    legalName: BUSINESS_NAME,
    description: AEO_STORE_DESCRIPTION,
    areaServed: [
      { "@type": "City", name: "Toronto" },
      { "@type": "State", name: "Ontario" },
      { "@type": "Country", name: "Canada" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_STREET_ADDRESS,
      addressLocality: BUSINESS_LOCALITY,
      addressRegion: BUSINESS_REGION,
      postalCode: BUSINESS_POSTAL_CODE,
      addressCountry: BUSINESS_COUNTRY,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.706,
      longitude: -79.453,
    },
    priceRange: "$8.99 - $129.99 CAD",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BUSINESS_PHONE,
      email: BUSINESS_EMAIL,
      contactType: "customer support",
      areaServed: "CA",
      availableLanguage: ["en"],
    },
    sameAs: [SITE_URL],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
