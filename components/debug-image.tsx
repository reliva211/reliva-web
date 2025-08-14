"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DebugImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function DebugImage({ src, alt, className }: DebugImageProps) {
  const [imageStatus, setImageStatus] = useState<string>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!src || src === "/placeholder.svg") {
      setImageStatus("placeholder");
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      console.log("Image loaded successfully:", src);
      setImageStatus("loaded");
    };
    img.onerror = () => {
      console.log("Image failed to load:", src);
      setImageStatus("error");
      setError("Failed to load image");
    };
    img.src = src;
  }, [src]);

  if (imageStatus === "error" || !src || src === "/placeholder.svg") {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Image Error</div>
          <div className="text-xs text-red-500">{error}</div>
          <div className="text-xs text-muted-foreground">URL: {src}</div>
        </div>
      </div>
    );
  }

  return (
    <Image src={src} alt={alt} fill className={className} unoptimized={true} />
  );
}
