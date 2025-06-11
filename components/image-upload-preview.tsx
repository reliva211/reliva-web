"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadPreviewProps {
  images: string[]
  onRemove: (index: number) => void
  maxImages?: number
}

export function ImageUploadPreview({ images, onRemove, maxImages = 4 }: ImageUploadPreviewProps) {
  if (images.length === 0) return null

  return (
    <div
      className={`grid gap-2 rounded-lg overflow-hidden ${
        images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2"
      }`}
    >
      {images.map((image, index) => (
        <div key={index} className="relative group aspect-video">
          <img
            src={image || "/placeholder.svg"}
            alt={`Upload ${index + 1}`}
            className="w-full h-full object-cover rounded-md"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3 text-white" />
          </Button>
        </div>
      ))}
      {images.length >= maxImages && (
        <div className="col-span-full text-center text-xs text-muted-foreground mt-1">
          Maximum of {maxImages} images reached
        </div>
      )}
    </div>
  )
}
