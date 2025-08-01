"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { IdSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";

export async function getProjectDocuments(projectId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return [];
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
      return [];
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;
    const isAssigned = project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return [];
    }

    // Get documents with uploadedBy information
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

    return documents;
  } catch (error) {
    console.error("Get project documents error:", error);
    return [];
  }
}
