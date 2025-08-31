"use client";

import { useState } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  priority = false,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // Image failed to load
    if (!hasError) {
      setHasError(true);
      setImgSrc("/placeholder.svg");
    }
  };

  // If the src is empty or invalid, use placeholder immediately
  if (!src || src.trim() === "" || src === "null" || src === "undefined") {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-xs text-muted-foreground">No Image</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={handleError}
      unoptimized={true} // Use unoptimized for external images
    />
  );
}
