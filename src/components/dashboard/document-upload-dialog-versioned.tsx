"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadDocumentVersion } from "@/lib/actions/documents-versioned";
import { DocumentGroup } from "@prisma/client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentUploadDialogVersionedProps {
  projectId: string;
  documentGroup?: DocumentGroup & {
    versions: { versionNumber: number }[];
  };
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  children?: React.ReactNode;
}

export function DocumentUploadDialogVersioned({ 
  projectId, 
  documentGroup,
  triggerText = "Upload Document",
  triggerVariant = "outline",
  children
}: DocumentUploadDialogVersionedProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const isNewVersion = !!documentGroup;
  const nextVersionNumber = documentGroup 
    ? Math.max(...documentGroup.versions.map(v => v.versionNumber)) + 1
    : 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("projectId", projectId);
      
      if (documentGroup) {
        formData.set("documentGroupId", documentGroup.id);
      }
      
      if (versionNotes.trim()) {
        formData.set("versionNotes", versionNotes.trim());
      }

      const result = await uploadDocumentVersion(formData, {
        documentGroupId: documentGroup?.id,
        versionNotes: versionNotes.trim() || undefined,
      });

      if (result.success) {
        if (result.isNewVersion) {
          toast.success(`Version ${result.versionNumber} uploaded successfully`);
        } else {
          toast.success("Document uploaded successfully");
        }
        setOpen(false);
        setFile(null);
        setVersionNotes("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setVersionNotes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={triggerVariant}>
            <Upload className="h-4 w-4 mr-2" />
            {triggerText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNewVersion 
              ? `Upload New Version (v${nextVersionNumber})` 
              : "Upload Document"
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isNewVersion && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                <Upload className="h-4 w-4" />
                <span className="font-medium">Creating New Version</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                This will create version {nextVersionNumber} of &quot;{documentGroup.name}&quot;.
                The previous version will remain accessible in the version history.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              required
              disabled={isUploading}
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG (max 10MB)
            </p>
          </div>

          {(isNewVersion || file) && (
            <div className="space-y-2">
              <Label htmlFor="versionNotes">
                Version Notes {isNewVersion ? "(Recommended)" : "(Optional)"}
              </Label>
              <Textarea
                id="versionNotes"
                name="versionNotes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder={
                  isNewVersion 
                    ? `Describe what changed in version ${nextVersionNumber}...`
                    : "Add notes about this document..."
                }
                rows={3}
                disabled={isUploading}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading 
                ? "Uploading..." 
                : isNewVersion 
                  ? `Upload v${nextVersionNumber}` 
                  : "Upload"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}