"use server";

import { authOptions } from "@/lib/auth";
import {
  deleteFromCloudinary,
  getCloudinaryResourceType,
} from "@/lib/cloudinary";
import { db } from "@/lib/db";
import {
  deleteFromImageKit,
  uploadToImageKit,
  validateFileForImageKit,
} from "@/lib/imagekit";
import { IdSchema } from "@/lib/validations";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpg",
  "image/jpeg",
];

interface UploadOptions {
  documentGroupId?: string; // For new versions of existing docs
  versionNotes?: string;
  replaceLatest?: boolean; // Replace current latest version
}

export async function uploadDocumentVersion(
  formData: FormData,
  options: UploadOptions = {}
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    const projectId = formData.get("projectId") as string;
    const file = formData.get("file") as File;

    if (!projectId || !file) {
      return {
        success: false,
        error: "Project ID and file are required.",
      };
    }

    // Validate project ID
    const validatedProjectId = IdSchema.parse(projectId);

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: validatedProjectId,
      },
      include: {
        assignments: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;
    const isAssigned = project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return {
        success: false,
        error: "You don't have permission to upload files to this project.",
      };
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error:
          "Invalid file type. Only PDF, DOC, DOCX, TXT, PNG, JPG, and JPEG files are allowed.",
      };
    }

    if (!validateFileForImageKit(file.type)) {
      return {
        success: false,
        error: "File type not supported by ImageKit.",
      };
    }

    let documentGroup;
    let isNewVersion = false;

    // Check if we're adding to an existing document group
    if (options.documentGroupId) {
      documentGroup = await db.documentGroup.findUnique({
        where: { id: options.documentGroupId },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });

      if (!documentGroup) {
        return {
          success: false,
          error: "Document group not found.",
        };
      }
      isNewVersion = true;
    } else {
      // Check if a document group with this name already exists
      const existingGroup = await db.documentGroup.findFirst({
        where: {
          projectId: validatedProjectId,
          name: file.name,
        },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });

      if (existingGroup) {
        documentGroup = existingGroup;
        isNewVersion = true;
      } else {
        // Create new document group
        const newGroup = await db.documentGroup.create({
          data: {
            projectId: validatedProjectId,
            name: file.name,
          },
        });
        
        // Add empty versions array for consistency
        documentGroup = {
          ...newGroup,
          versions: [],
        };
      }
    }

    // Determine version number
    const latestVersion = documentGroup.versions[0];
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `v${newVersionNumber}_${Date.now()}_${randomUUID()}.${fileExtension}`;

    // Upload file to ImageKit
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imagekitResult = await uploadToImageKit(buffer, uniqueFilename, {
      folder: `/pixelforge/projects/${validatedProjectId}/documents/${documentGroup.id}`,
      tags: ["pixelforge", "document", validatedProjectId, documentGroup.id, `v${newVersionNumber}`],
      useUniqueFileName: true,
    });

    // Mark previous latest as not latest if not replacing
    if (isNewVersion && !options.replaceLatest) {
      await db.documentVersion.updateMany({
        where: {
          documentGroupId: documentGroup.id,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });
    }

    // Create new version record
    const newVersion = await db.documentVersion.create({
      data: {
        documentGroupId: documentGroup.id,
        versionNumber: newVersionNumber,
        filename: uniqueFilename,
        originalFilename: file.name,
        imagekitFileId: imagekitResult.fileId,
        imagekitUrl: imagekitResult.url,
        imagekitFilePath: imagekitResult.filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: session.user.id,
        storageProvider: "imagekit",
        versionNotes: options.versionNotes || null,
        isLatest: true,
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        documentGroup: true,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      data: newVersion,
      isNewVersion,
      versionNumber: newVersionNumber,
    };
  } catch (error) {
    console.error("Upload document version error:", error);
    return {
      success: false,
      error: "Failed to upload document version.",
    };
  }
}

export async function getDocumentGroups(projectId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate project ID
    const validatedProjectId = IdSchema.parse(projectId);

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: validatedProjectId,
      },
      include: {
        assignments: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;
    const isAssigned = project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return {
        success: false,
        error: "You don't have permission to view documents for this project.",
      };
    }

    // Get document groups with their latest versions
    const documentGroups = await db.documentGroup.findMany({
      where: {
        projectId: validatedProjectId,
      },
      include: {
        versions: {
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            versionNumber: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return {
      success: true,
      data: documentGroups,
    };
  } catch (error) {
    console.error("Get document groups error:", error);
    return {
      success: false,
      error: "Failed to fetch document groups.",
    };
  }
}

export async function getDocumentVersions(documentGroupId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(documentGroupId);

    // Get document group with project info for permission check
    const documentGroup = await db.documentGroup.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        project: {
          include: {
            assignments: {
              select: {
                userId: true,
              },
            },
          },
        },
        versions: {
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            versionNumber: "desc",
          },
        },
      },
    });

    if (!documentGroup) {
      return {
        success: false,
        error: "Document group not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = documentGroup.project.createdById === session.user.id;
    const isAssigned = documentGroup.project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return {
        success: false,
        error: "You don't have permission to view this document's versions.",
      };
    }

    return {
      success: true,
      data: documentGroup,
    };
  } catch (error) {
    console.error("Get document versions error:", error);
    return {
      success: false,
      error: "Failed to fetch document versions.",
    };
  }
}

export async function restoreDocumentVersion(
  documentGroupId: string,
  versionNumber: number
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(documentGroupId);

    // Get document group with project info for permission check
    const documentGroup = await db.documentGroup.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        project: {
          include: {
            assignments: {
              select: {
                userId: true,
              },
            },
          },
        },
        versions: true,
      },
    });

    if (!documentGroup) {
      return {
        success: false,
        error: "Document group not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = documentGroup.project.createdById === session.user.id;
    const isAssigned = documentGroup.project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return {
        success: false,
        error: "You don't have permission to restore this document version.",
      };
    }

    // Find the version to restore
    const versionToRestore = documentGroup.versions.find(
      (v) => v.versionNumber === versionNumber
    );

    if (!versionToRestore) {
      return {
        success: false,
        error: "Version not found.",
      };
    }

    // Mark all versions as not latest
    await db.documentVersion.updateMany({
      where: {
        documentGroupId: validatedId,
      },
      data: {
        isLatest: false,
      },
    });

    // Mark the specified version as latest
    await db.documentVersion.update({
      where: {
        id: versionToRestore.id,
      },
      data: {
        isLatest: true,
      },
    });

    revalidatePath(`/dashboard/projects/${documentGroup.project.id}`);

    return {
      success: true,
      message: `Version ${versionNumber} restored as latest.`,
    };
  } catch (error) {
    console.error("Restore document version error:", error);
    return {
      success: false,
      error: "Failed to restore document version.",
    };
  }
}

export async function deleteDocumentVersion(
  documentGroupId: string,
  versionNumber: number
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(documentGroupId);

    // Get document group with project info for permission check
    const documentGroup = await db.documentGroup.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        project: {
          include: {
            assignments: {
              select: {
                userId: true,
              },
            },
          },
        },
        versions: true,
      },
    });

    if (!documentGroup) {
      return {
        success: false,
        error: "Document group not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = documentGroup.project.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return {
        success: false,
        error: "You don't have permission to delete document versions.",
      };
    }

    // Find the version to delete
    const versionToDelete = documentGroup.versions.find(
      (v) => v.versionNumber === versionNumber
    );

    if (!versionToDelete) {
      return {
        success: false,
        error: "Version not found.",
      };
    }

    // Don't allow deletion if it's the only version
    if (documentGroup.versions.length === 1) {
      return {
        success: false,
        error: "Cannot delete the only version of a document. Delete the entire document instead.",
      };
    }

    // Delete file from storage provider
    try {
      if (versionToDelete.storageProvider === "imagekit" && versionToDelete.imagekitFileId) {
        await deleteFromImageKit(versionToDelete.imagekitFileId);
      } else if (versionToDelete.storageProvider === "cloudinary" && versionToDelete.cloudinaryPublicId) {
        await deleteFromCloudinary(
          versionToDelete.cloudinaryPublicId,
          getCloudinaryResourceType(versionToDelete.mimeType)
        );
      }
    } catch (fileError) {
      console.error("Error deleting file from storage:", fileError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete version record
    await db.documentVersion.delete({
      where: {
        id: versionToDelete.id,
      },
    });

    // If we deleted the latest version, make the highest remaining version latest
    if (versionToDelete.isLatest) {
      const remainingVersions = await db.documentVersion.findMany({
        where: {
          documentGroupId: validatedId,
        },
        orderBy: {
          versionNumber: "desc",
        },
        take: 1,
      });

      if (remainingVersions.length > 0) {
        await db.documentVersion.update({
          where: {
            id: remainingVersions[0].id,
          },
          data: {
            isLatest: true,
          },
        });
      }
    }

    revalidatePath(`/dashboard/projects/${documentGroup.project.id}`);

    return {
      success: true,
      message: `Version ${versionNumber} deleted successfully.`,
    };
  } catch (error) {
    console.error("Delete document version error:", error);
    return {
      success: false,
      error: "Failed to delete document version.",
    };
  }
}

export async function deleteDocumentGroup(documentGroupId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(documentGroupId);

    // Get document group with project info for permission check
    const documentGroup = await db.documentGroup.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        project: {
          include: {
            assignments: {
              select: {
                userId: true,
              },
            },
          },
        },
        versions: true,
      },
    });

    if (!documentGroup) {
      return {
        success: false,
        error: "Document group not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = documentGroup.project.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return {
        success: false,
        error: "You don't have permission to delete this document.",
      };
    }

    // Delete all files from storage providers
    for (const version of documentGroup.versions) {
      try {
        if (version.storageProvider === "imagekit" && version.imagekitFileId) {
          await deleteFromImageKit(version.imagekitFileId);
        } else if (version.storageProvider === "cloudinary" && version.cloudinaryPublicId) {
          await deleteFromCloudinary(
            version.cloudinaryPublicId,
            getCloudinaryResourceType(version.mimeType)
          );
        }
      } catch (fileError) {
        console.error("Error deleting file from storage:", fileError);
        // Continue with next file deletion
      }
    }

    // Delete document group (cascade will delete all versions)
    await db.documentGroup.delete({
      where: {
        id: validatedId,
      },
    });

    revalidatePath(`/dashboard/projects/${documentGroup.project.id}`);

    return {
      success: true,
      message: "Document and all versions deleted successfully.",
    };
  } catch (error) {
    console.error("Delete document group error:", error);
    return {
      success: false,
      error: "Failed to delete document group.",
    };
  }
}