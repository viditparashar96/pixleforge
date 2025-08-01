"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteDocumentFromImageKit } from "@/lib/actions/documents-imagekit";
import { Document } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  File,
  FileText,
  FileType,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentPreviewDialog } from "./document-preview-dialog";
import { DocumentUploadDialog } from "./document-upload-dialog";

interface ProjectDocumentsProps {
  documents: Document[];
  projectId: string;
  userRole: string;
  canUpload: boolean;
}

export function ProjectDocuments({
  documents,
  projectId,
  userRole,
  canUpload,
}: ProjectDocumentsProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setIsDeleting(documentId);

    try {
      const result = await deleteDocumentFromImageKit(documentId);
      if (result.success) {
        toast.success("Document deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete document");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download/${documentId}`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Check if it's a redirect response to Cloudinary
      if (
        response.redirected ||
        response.url !== `/api/download/${documentId}`
      ) {
        // Open the redirected URL in a new tab for download
        window.open(response.url, "_blank");
      } else {
        // Handle blob response (legacy files)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success("Download started");
    } catch {
      toast.error("Failed to download file");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (mimeType.includes("pdf")) {
      return <FileType className="h-4 w-4 text-red-500" />;
    } else if (mimeType.includes("document") || mimeType.includes("word")) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
          {canUpload && <DocumentUploadDialog projectId={projectId} />}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No documents uploaded yet
            </p>
            {canUpload && <DocumentUploadDialog projectId={projectId} />}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(document.mimeType)}

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {document.originalFilename}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {document.mimeType.split("/")[1].toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>
                        Uploaded{" "}
                        {formatDistanceToNow(new Date(document.uploadedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DocumentPreviewDialog
                    documentId={document.id}
                    fileName={document.originalFilename}
                    mimeType={document.mimeType}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDownload(document.id, document.originalFilename)
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {(userRole === "ADMIN" || canUpload) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        handleDelete(document.id, document.originalFilename)
                      }
                      disabled={isDeleting === document.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
