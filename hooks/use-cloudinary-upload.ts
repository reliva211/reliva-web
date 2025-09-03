"use client";

import { useState } from "react";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  extractPublicId,
} from "@/lib/cloudinary";

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useCloudinaryUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const uploadImage = async (
    file: File,
    folder: string = "reliva-profiles"
  ): Promise<string> => {
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
    });

    try {
      // Validate file size (10MB limit for Cloudinary free tier)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Simulate progress (Cloudinary doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const imageUrl = await uploadImageToCloudinary(file, folder);

      clearInterval(progressInterval);

      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
      });

      return imageUrl;
    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
      });
      throw error;
    }
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteImageFromCloudinary(publicId);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  };

  const resetUploadState = () => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
    });
  };

  return {
    uploadImage,
    deleteImage,
    resetUploadState,
    uploading: uploadState.uploading,
    progress: uploadState.progress,
    error: uploadState.error,
  };
}
