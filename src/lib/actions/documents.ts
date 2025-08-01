"use server";

import { authOptions } from "@/lib/auth";
import {
  deleteFromCloudinary,
  getCloudinaryResourceType,
  uploadToCloudinary,
} from "@/lib/cloudinary";
import { db } from "@/lib/db";
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

export async function uploadDocument(formData: FormData) {
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

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;

    // Upload file to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: `pixelforge/projects/${validatedProjectId}`,
      resource_type: getCloudinaryResourceType(file.type),
      public_id: `${Date.now()}_${uniqueFilename}`,
      tags: ["pixelforge", "document", validatedProjectId],
    });

    // Save document record to database
    const document = await db.document.create({
      data: {
        projectId: validatedProjectId,
        filename: uniqueFilename,
        originalFilename: file.name,
        cloudinaryPublicId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      data: document,
    };
  } catch (error) {
    console.error("Upload document error:", error);
    return {
      success: false,
      error: "Failed to upload document.",
    };
  }
}

export async function getDocuments(projectId: string) {
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

    // Get documents
    const documents = await db.document.findMany({
      where: {
        projectId: validatedProjectId,
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    console.error("Get documents error:", error);
    return {
      success: false,
      error: "Failed to fetch documents.",
    };
  }
}

export async function deleteDocument(id: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(id);

    // Find document with project info
    const document = await db.document.findUnique({
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
      },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found.",
      };
    }

    // Check permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = document.project.createdById === session.user.id;
    const isUploader = document.uploadedById === session.user.id;

    if (!isAdmin && !isCreator && !isUploader) {
      return {
        success: false,
        error: "You don't have permission to delete this document.",
      };
    }

    // Delete file from Cloudinary
    try {
      await deleteFromCloudinary(
        document.cloudinaryPublicId,
        getCloudinaryResourceType(document.mimeType)
      );
    } catch (fileError) {
      console.error("Error deleting file from Cloudinary:", fileError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete document record
    await db.document.delete({
      where: {
        id: validatedId,
      },
    });

    revalidatePath(`/dashboard/projects/${document.projectId}`);

    return {
      success: true,
      message: "Document deleted successfully.",
    };
  } catch (error) {
    console.error("Delete document error:", error);
    return {
      success: false,
      error: "Failed to delete document.",
    };
  }
}
