import { B2B_CONTACT_URL, WHOLESALE_CTA_LABEL } from "@/lib/site-mode";

interface Props {
  /** "button" = full CTA button; "link" = inline text link; "label" = static price-replacement tag */
  variant?: "button" | "link" | "label";
  label?: string;
  className?: string;
}

export function WholesaleCta({ variant = "button", label, className = "" }: Props) {
  if (variant === "label") {
    return (
      <span className={`text-[11px] font-semibold uppercase tracking-wide text-brand ${className}`}>
        {label ?? "Wholesale — contact for pricing"}
      </span>
    );
  }

  if (variant === "link") {
    return (
      <a
        href={B2B_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-sm font-bold text-brand hover:underline ${className}`}
      >
        {label ?? `${WHOLESALE_CTA_LABEL} →`}
      </a>
    );
  }

  return (
    <a
      href={B2B_CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover ${className}`}
    >
      {label ?? `${WHOLESALE_CTA_LABEL} →`}
    </a>
  );
}
