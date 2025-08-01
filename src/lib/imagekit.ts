import ImageKit from "imagekit";

// Configure ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

export { imagekit };

// Helper function to upload a file to ImageKit
export async function uploadToImageKit(
  fileBuffer: Buffer,
  fileName: string,
  options: {
    folder?: string;
    tags?: string[];
    useUniqueFileName?: boolean;
  } = {}
) {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: options.folder || "/pixelforge/documents",
      tags: options.tags?.join(",") || "pixelforge,document",
      useUniqueFileName: options.useUniqueFileName !== false,
    });

    return result;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload file to ImageKit");
  }
}

// Helper function to delete a file from ImageKit
export async function deleteFromImageKit(fileId: string) {
  try {
    const result = await imagekit.deleteFile(fileId);
    return result;
  } catch (error) {
    console.error("ImageKit delete error:", error);
    throw new Error("Failed to delete file from ImageKit");
  }
}

// Helper function to generate optimized URLs for different file types
export function generateImageKitUrl(
  filePath: string,
  options: {
    transformation?: Array<{
      width?: number;
      height?: number;
      quality?: number | "auto";
      crop?: string;
      format?: string;
    }>;
  } = {}
) {
  const urlOptions: {
    path: string;
    transformation?: Array<{
      width?: number;
      height?: number;
      quality?: number | "auto";
      crop?: string;
      format?: string;
    }>;
  } = {
    path: filePath,
  };

  if (options.transformation && options.transformation.length > 0) {
    urlOptions.transformation = options.transformation;
  }

  return imagekit.url(urlOptions);
}

// Helper function to generate direct delivery URL
export function generateDirectImageKitUrl(filePath: string) {
  if (!filePath || filePath.trim() === '') {
    console.error('ImageKit: Empty file path provided');
    return null;
  }
  
  try {
    return imagekit.url({
      path: filePath,
    });
  } catch (error) {
    console.error('ImageKit URL generation error:', error, 'FilePath:', filePath);
    return null;
  }
}

// Helper function to generate thumbnail URL for preview
export function generateImageKitThumbnailUrl(filePath: string, mimeType: string) {
  // For images, generate a thumbnail
  if (mimeType.startsWith("image/")) {
    return imagekit.url({
      path: filePath,
      transformation: [
        {
          width: 300,
          height: 300,
          crop: "at_max",
          quality: "auto",
        },
      ],
    });
  }

  // For PDFs, ImageKit can generate thumbnails from the first page
  if (mimeType === "application/pdf") {
    return imagekit.url({
      path: filePath,
      transformation: [
        {
          width: 300,
          height: 300,
          crop: "at_max",
          quality: "auto",
          format: "jpg", // Convert PDF page to JPG
        },
      ],
    });
  }

  // For other file types, return null (no preview)
  return null;
}

// Helper function to get file metadata from ImageKit
export async function getImageKitFileDetails(fileId: string) {
  try {
    const result = await imagekit.getFileDetails(fileId);
    return result;
  } catch (error) {
    console.error("ImageKit get file details error:", error);
    throw new Error("Failed to get file details from ImageKit");
  }
}

// Helper function to list files from a folder
export async function listImageKitFiles(
  options: {
    path?: string;
    limit?: number;
    skip?: number;
    tags?: string;
  } = {}
) {
  try {
    const result = await imagekit.listFiles({
      path: options.path || "/pixelforge/documents",
      limit: options.limit || 1000,
      skip: options.skip || 0,
      tags: options.tags,
    });
    return result;
  } catch (error) {
    console.error("ImageKit list files error:", error);
    throw new Error("Failed to list files from ImageKit");
  }
}

// Helper function to get authentication parameters for client-side uploads
export function getImageKitAuthParameters() {
  const token = imagekit.getAuthenticationParameters();
  return token;
}

// Helper function to validate file type for ImageKit upload
export function validateFileForImageKit(mimeType: string): boolean {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpg",
    "image/jpeg",
  ];
  
  return allowedTypes.includes(mimeType);
}

// Helper function to generate signed URL for secure access
export async function generateSignedImageKitUrl(
  filePath: string,
  expireSeconds: number = 3600 // Default 1 hour
) {
  try {
    // ImageKit doesn't have built-in signed URLs like Cloudinary,
    // but we can use authentication parameters for secure access
    // const authParams = getImageKitAuthParameters();
    
    // Generate URL with authentication token (if needed for private files)
    return imagekit.url({
      path: filePath,
      signed: true,
      expireSeconds: expireSeconds,
    });
  } catch (error) {
    console.error("ImageKit signed URL error:", error);
    throw new Error("Failed to generate signed URL");
  }
}