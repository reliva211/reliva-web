// Browser-compatible Cloudinary implementation
// No server-side imports needed for client-side uploads

// Image upload with automatic optimization for free tier
export const uploadImageToCloudinary = async (
  file: File,
  folder: string = "reliva-profiles"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if required environment variables are set
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      reject(
        new Error(
          "Cloudinary configuration missing. Please check your .env.local file."
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    // Note: Transformation parameters are not allowed in unsigned uploads
    // Optimizations will be applied via upload preset configuration in Cloudinary dashboard

    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data.secure_url);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// Generate optimized image URL with transformations
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
  } = {}
): string => {
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
  } = options;

  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  transformations.push(`c_${crop}`);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transformationString = transformations.join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`;
};

// Delete image from Cloudinary (requires server-side implementation)
export const deleteImageFromCloudinary = async (
  publicId: string
): Promise<void> => {
  // Note: This requires server-side implementation with API secret
  // For now, we'll just log a warning
  console.warn(
    "Image deletion requires server-side implementation with API secret"
  );
  throw new Error("Image deletion not implemented for client-side");
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url: string): string | null => {
  const regex = /\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp|avif)$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};
