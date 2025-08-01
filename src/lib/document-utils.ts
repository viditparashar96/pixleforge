// Type for document with storage provider fields
type DocumentWithStorage = {
  storageProvider: string;
  imagekitUrl?: string | null;
  imagekitFilePath?: string | null;
  cloudinaryUrl?: string | null;
  cloudinaryPublicId?: string | null;
};

// Helper function to get the appropriate download URL based on storage provider
export function getDocumentDownloadUrl(document: DocumentWithStorage): string | null {
  if (document.storageProvider === "imagekit" && document.imagekitUrl) {
    return document.imagekitUrl;
  } else if (document.storageProvider === "cloudinary" && document.cloudinaryUrl) {
    return document.cloudinaryUrl;
  }
  return null;
}

// Helper function to get the appropriate file path based on storage provider
export function getDocumentFilePath(document: DocumentWithStorage): string | null {
  if (document.storageProvider === "imagekit" && document.imagekitFilePath) {
    return document.imagekitFilePath;
  }
  
  if (document.storageProvider === "cloudinary" && document.cloudinaryPublicId) {
    return document.cloudinaryPublicId;
  }
  
  return null;
}