"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  placeholderGradient: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  placeholderGradient,
  fill = true,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className = "object-cover",
  priority = false,
}: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: placeholderGradient }}
        aria-label={alt}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setErrored(true)}
    />
  );
}
