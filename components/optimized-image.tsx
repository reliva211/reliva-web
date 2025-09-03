"use client";

import Image from "next/image";
import { getOptimizedImageUrl, extractPublicId } from "@/lib/cloudinary";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: string;
  format?: string;
  crop?: string;
  fill?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = "auto",
  format = "auto",
  crop = "fill",
  fill = false,
  sizes,
}: OptimizedImageProps) {
  // Check if it's a Cloudinary URL
  const isCloudinaryUrl = src.includes("cloudinary.com");

  let optimizedSrc = src;

  if (isCloudinaryUrl) {
    const publicId = extractPublicId(src);
    if (publicId) {
      optimizedSrc = getOptimizedImageUrl(publicId, {
        width: fill ? undefined : width,
        height: fill ? undefined : height,
        quality,
        format,
        crop,
      });
    }
  }

  if (fill) {
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={
          sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
        quality={quality === "auto" ? 75 : parseInt(quality)}
      />
    );
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={quality === "auto" ? 75 : parseInt(quality)}
    />
  );
}

// Avatar component with automatic optimization
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      quality="auto"
      format="auto"
      crop="fill"
    />
  );
}

// Cover image component with automatic optimization
export function OptimizedCoverImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      quality="auto"
      format="auto"
      crop="fill"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
    />
  );
}
