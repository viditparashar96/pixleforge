"use client";

import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentPreviewDialogProps {
  documentId: string;
  fileName: string;
  mimeType: string;
}

export function DocumentPreviewDialog({
  documentId,
  fileName,
  mimeType,
}: DocumentPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isPreviewable = (mimeType: string) => {
    return (
      mimeType.startsWith("image/") ||
      mimeType === "application/pdf" ||
      mimeType === "text/plain"
    );
  };

  const handleOpenPreview = async () => {
    if (!isPreviewable(mimeType)) {
      toast.error("Preview not available for this file type");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/preview/${documentId}`, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error("Failed to load preview");
      }

      // Check if it's a redirect response by looking at the final URL
      const finalUrl = response.url;
      const isRedirect = !finalUrl.includes('/api/preview/') || 
                        finalUrl !== `${window.location.origin}/api/preview/${documentId}`;
      
      if (isRedirect) {
        // It's a direct URL from ImageKit or Cloudinary, open in new tab
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
        toast.success("Document opened in new tab");
      } else {
        // It's a blob response (legacy files), create object URL and open in new tab
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        // Clean up the object URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        toast.success("Document opened in new tab");
      }
    } catch (error) {
      console.error('Preview error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preview';
      toast.error(`Preview failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };


  if (!isPreviewable(mimeType)) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleOpenPreview}
      disabled={isLoading}
      title={`Preview ${fileName} in new tab`}
    >
      {isLoading ? (
        <FileText className="h-4 w-4 animate-pulse" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}
