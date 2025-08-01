import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Helper function to upload a file to Cloudinary
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    resource_type?: "auto" | "image" | "video" | "raw";
    public_id?: string;
    tags?: string[];
  } = {}
) {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: options.folder || "pixelforge/documents",
            resource_type: options.resource_type || "auto",
            public_id: options.public_id,
            tags: options.tags || ["pixelforge", "document"],
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(fileBuffer);
    });

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

// Helper function to delete a file from Cloudinary
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "raw"
) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}

// Helper function to generate optimized URLs for different file types
export function generateCloudinaryUrl(
  publicId: string,
  options: {
    resourceType?: "image" | "video" | "raw";
    transformation?: Record<string, string | number>;
    format?: string;
  } = {}
) {
  // Generate a signed URL for untrusted accounts
  return cloudinary.url(publicId, {
    resource_type: options.resourceType || "raw",
    secure: true,
    transformation: options.transformation,
    format: options.format,
    type: "upload",
    sign_url: true,
  });
}

// Helper function to generate a direct delivery URL (bypasses untrusted restrictions)
export function generateDirectCloudinaryUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "raw"
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  if (!publicId || publicId.trim() === '') {
    console.error('Cloudinary: Empty public ID provided');
    return null;
  }
  
  if (!cloudName) {
    console.error('Cloudinary: Cloud name not configured');
    return null;
  }

  try {
    // For untrusted accounts, we can try different approaches:
    // 1. Try the basic URL structure
    const baseUrl = `https://res.cloudinary.com/${cloudName}`;

    // 2. For raw files (PDFs, docs), try without transformations
    if (resourceType === "raw") {
      return `${baseUrl}/raw/upload/${publicId}`;
    }

    // 3. For images, use the image delivery
    return `${baseUrl}/${resourceType}/upload/${publicId}`;
  } catch (error) {
    console.error('Cloudinary URL generation error:', error, 'PublicId:', publicId);
    return null;
  }
}

// Alternative function that works with unsigned delivery
export function generateUnsignedCloudinaryUrl(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "raw"
) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  // For unsigned delivery, we use a different URL pattern
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/v1_1/${publicId}`;
}

// Helper function to generate thumbnail URL for preview
export function generateThumbnailUrl(publicId: string, mimeType: string) {
  // For images, generate a thumbnail
  if (mimeType.startsWith("image/")) {
    return cloudinary.url(publicId, {
      resource_type: "image",
      transformation: [
        { width: 300, height: 300, crop: "limit", quality: "auto" },
      ],
      secure: true,
      type: "upload",
      sign_url: true,
    });
  }

  // For PDFs, generate a thumbnail from the first page
  if (mimeType === "application/pdf") {
    return cloudinary.url(publicId, {
      resource_type: "image",
      transformation: [
        { width: 300, height: 300, crop: "limit", quality: "auto", page: 1 },
      ],
      secure: true,
      type: "upload",
      sign_url: true,
    });
  }

  // For other file types, return null (no preview)
  return null;
}

// Helper function to get file type from mime type for Cloudinary resource_type
export function getCloudinaryResourceType(
  mimeType: string
): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return "raw";
}
