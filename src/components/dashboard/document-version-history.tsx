"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  deleteDocumentVersion,
  getDocumentVersions,
  restoreDocumentVersion,
} from "@/lib/actions/documents-versioned";
import { DocumentGroup, DocumentVersion } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentVersionHistoryProps {
  documentGroup: DocumentGroup & {
    versions: (DocumentVersion & {
      uploadedBy: {
        firstName: string;
        lastName: string;
      };
    })[];
  };
  userRole: string;
  canDelete?: boolean;
}

export function DocumentVersionHistory({
  documentGroup,
  userRole,
  canDelete = false,
}: DocumentVersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState(documentGroup.versions);
  const router = useRouter();

  const refreshVersions = async () => {
    try {
      const result = await getDocumentVersions(documentGroup.id);
      if (result.success && result.data) {
        setVersions(result.data.versions);
      }
    } catch (error) {
      console.error("Error refreshing versions:", error);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (
      !confirm(
        `Are you sure you want to make version ${versionNumber} the latest version?`
      )
    ) {
      return;
    }

    try {
      const result = await restoreDocumentVersion(
        documentGroup.id,
        versionNumber
      );
      if (result.success) {
        toast.success(result.message);
        await refreshVersions();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to restore version");
      }
    } catch {
      toast.error("Failed to restore version");
    }
  };

  const handleDelete = async (versionNumber: number) => {
    if (
      !confirm(
        `Are you sure you want to delete version ${versionNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteDocumentVersion(
        documentGroup.id,
        versionNumber
      );
      if (result.success) {
        toast.success(result.message);
        await refreshVersions();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete version");
      }
    } catch {
      toast.error("Failed to delete version");
    }
  };

  const handlePreview = (version: DocumentVersion) => {
    window.open(`/api/preview/${version.id}`, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (version: DocumentVersion) => {
    window.open(`/api/download/${version.id}`, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isPreviewable = (mimeType: string) => {
    return (
      mimeType.startsWith("image/") ||
      mimeType === "application/pdf" ||
      mimeType === "text/plain"
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History ({versions.length})
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 mt-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">All Versions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={version.isLatest ? "default" : "secondary"}>
                      v{version.versionNumber}
                    </Badge>
                    {version.isLatest && (
                      <Badge variant="outline" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>

                  {version.versionNotes && (
                    <p className="text-sm text-foreground mb-1 line-clamp-2">
                      {version.versionNotes}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(version.fileSize)}</span>
                    <span>•</span>
                    <span>
                      {version.uploadedBy.firstName}{" "}
                      {version.uploadedBy.lastName}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(version.uploadedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isPreviewable(version.mimeType) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreview(version)}
                      title="Preview version"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(version)}
                    title="Download version"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {!version.isLatest &&
                    (userRole === "ADMIN" || userRole === "PROJECT_LEAD") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestore(version.versionNumber)}
                        title="Make this the latest version"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                  {canDelete &&
                    versions.length > 1 &&
                    (userRole === "ADMIN" || userRole === "PROJECT_LEAD") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(version.versionNumber)}
                        title="Delete this version"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
