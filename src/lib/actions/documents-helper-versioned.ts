"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { IdSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";

export async function getProjectDocumentGroups(projectId: string) {
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

    // Get document groups with their versions
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
    console.error("Get project document groups error:", error);
    return {
      success: false,
      error: "Failed to fetch project documents.",
    };
  }
}

// Legacy function that returns both versioned and legacy documents
export async function getProjectDocumentsWithLegacy(projectId: string) {
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

    // Get both versioned and legacy documents
    const [documentGroups, legacyDocuments] = await Promise.all([
      db.documentGroup.findMany({
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
      }),
      db.document.findMany({
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
      }),
    ]);

    return {
      success: true,
      data: {
        documentGroups,
        legacyDocuments,
      },
    };
  } catch (error) {
    console.error("Get project documents with legacy error:", error);
    return {
      success: false,
      error: "Failed to fetch project documents.",
    };
  }
}