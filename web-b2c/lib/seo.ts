import type { Product } from "@/lib/types";

export const SITE_URL = "https://fifa2026.ca";
export const SITE_NAME = "World Fan Gear";

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
  return `Shop ${product.name} from World Fan Gear. Canada 2026-inspired soccer fan merchandise shipping from Toronto.`;
}

export function productJsonLd(product: Product) {
  const images = [absoluteUrl(product.imageUrl)];
  if (product.additionalImages?.length) {
    images.push(...product.additionalImages.map(absoluteUrl));
  }

  return {
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
        name: SITE_NAME,
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
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/asset/logo.jpg"),
    legalName: "Butterfly Fashion Trading",
    description:
      "Toronto-based World Cup 2026 fan gear store. Caps, bucket hats, car flags, Panini sticker packs shipped from North York, ON across Canada.",
    areaServed: [
      { "@type": "City", name: "Toronto" },
      { "@type": "State", name: "Ontario" },
      { "@type": "Country", name: "Canada" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "178 Bentworth Ave",
      addressLocality: "North York",
      addressRegion: "ON",
      postalCode: "M6A 1P7",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.706,
      longitude: -79.453,
    },
    priceRange: "$10 – $35 CAD",
    contactPoint: {
      "@type": "ContactPoint",
      email: "jameskimkim1@gmail.com",
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
