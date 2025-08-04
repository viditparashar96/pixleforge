"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteDocumentGroup } from "@/lib/actions/documents-versioned";
import { DocumentGroup, DocumentVersion } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  File,
  FileText,
  FileType,
  ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentPreviewDialog } from "./document-preview-dialog";
import { DocumentUploadDialogVersioned } from "./document-upload-dialog-versioned";
import { DocumentVersionHistory } from "./document-version-history";

interface ProjectDocumentsVersionedProps {
  documentGroups: (DocumentGroup & {
    versions: (DocumentVersion & {
      uploadedBy: {
        firstName: string;
        lastName: string;
      };
    })[];
  })[];
  projectId: string;
  userRole: string;
  canUpload: boolean;
}

export function ProjectDocumentsVersioned({
  documentGroups,
  projectId,
  userRole,
  canUpload,
}: ProjectDocumentsVersionedProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteDocumentGroup = async (documentGroupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete &quot;${groupName}&quot; and all its versions? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(documentGroupId);

    try {
      const result = await deleteDocumentGroup(documentGroupId);
      if (result.success) {
        toast.success("Document and all versions deleted successfully");
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

  const handleDownload = async (documentVersionId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download/${documentVersionId}`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Check if it's a redirect response
      if (
        response.redirected ||
        response.url !== `/api/download/${documentVersionId}`
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

  const getLatestVersion = (versions: DocumentVersion[]) => {
    return versions.find(v => v.isLatest) || versions[0];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({documentGroups.length})
          </CardTitle>
          {canUpload && (
            <DocumentUploadDialogVersioned 
              projectId={projectId} 
              triggerText="Upload New Document"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documentGroups.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No documents uploaded yet
            </p>
            {canUpload && (
              <DocumentUploadDialogVersioned 
                projectId={projectId} 
                triggerText="Upload First Document"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {documentGroups.map((group) => {
              const latestVersion = getLatestVersion(group.versions);
              const hasMultipleVersions = group.versions.length > 1;

              return (
                <div
                  key={group.id}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/25 transition-colors"
                >
                  {/* Document Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(latestVersion.mimeType)}

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {group.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {latestVersion.mimeType.split("/")[1].toUpperCase()}
                          </Badge>
                          {hasMultipleVersions && (
                            <Badge variant="secondary" className="text-xs">
                              v{latestVersion.versionNumber}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatFileSize(latestVersion.fileSize)}</span>
                          <span>•</span>
                          <span>
                            {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
                          </span>
                          <span>•</span>
                          <span>
                            Updated{" "}
                            {formatDistanceToNow(new Date(latestVersion.uploadedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        {latestVersion.versionNotes && (
                          <p className="text-xs text-muted-foreground italic line-clamp-1">
                            &quot;{latestVersion.versionNotes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DocumentPreviewDialog
                        documentId={latestVersion.id}
                        fileName={group.name}
                        mimeType={latestVersion.mimeType}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownload(latestVersion.id, group.name)
                        }
                        title="Download latest version"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {canUpload && (
                        <DocumentUploadDialogVersioned
                          projectId={projectId}
                          documentGroup={{
                            ...group,
                            versions: group.versions.map(v => ({ versionNumber: v.versionNumber }))
                          }}
                        >
                          <Button variant="ghost" size="sm" title="Upload new version">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DocumentUploadDialogVersioned>
                      )}

                      {(userRole === "ADMIN" || userRole === "PROJECT_LEAD") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDeleteDocumentGroup(group.id, group.name)
                          }
                          disabled={isDeleting === group.id}
                          title="Delete document and all versions"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Version History */}
                  {hasMultipleVersions && (
                    <DocumentVersionHistory
                      documentGroup={group}
                      userRole={userRole}
                      canDelete={userRole === "ADMIN" || userRole === "PROJECT_LEAD"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}