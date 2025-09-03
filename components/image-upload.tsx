"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";

interface ImageUploadProps {
  onUploadAction: (file: File) => Promise<void>;
  className?: string;
  children: React.ReactNode;
  accept?: string;
}

export function ImageUpload({
  onUploadAction,
  className,
  children,
  accept = "image/*",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, error } = useCloudinaryUpload();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onUploadAction(file);
    } catch (error) {
      console.error("Upload error:", error);
      // Error handling is done in the Cloudinary hook
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {children}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-white/90 text-black hover:bg-white"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">{progress}%</span>
            </div>
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

interface CoverImageUploadProps {
  onUploadAction: (file: File) => Promise<void>;
  children: React.ReactNode;
}

export function CoverImageUpload({
  onUploadAction,
  children,
}: CoverImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, error } = useCloudinaryUpload();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onUploadAction(file);
    } catch (error) {
      console.error("Upload error:", error);
      // Error handling is done in the Cloudinary hook
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative group">
      {children}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-white/90 text-black hover:bg-white"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading... {progress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Change Cover
            </>
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
