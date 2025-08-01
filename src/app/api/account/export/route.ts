import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user data with all related information
    const userData = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        createdProjects: {
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
            documents: {
              select: {
                id: true,
                filename: true,
                originalFilename: true,
                fileSize: true,
                mimeType: true,
                uploadedAt: true,
                storageProvider: true,
              },
            },
          },
        },
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                deadline: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        uploadedDocuments: {
          select: {
            id: true,
            filename: true,
            originalFilename: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
            storageProvider: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, mfaSecret: __, ...safeUserData } = userData;

    // Create export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        version: "1.0",
        platform: "PixelForge Nexus",
      },
      profile: {
        id: safeUserData.id,
        email: safeUserData.email,
        firstName: safeUserData.firstName,
        lastName: safeUserData.lastName,
        role: safeUserData.role,
        mfaEnabled: safeUserData.mfaEnabled,
        accountCreated: safeUserData.createdAt,
        lastUpdated: safeUserData.updatedAt,
      },
      projects: {
        created: safeUserData.createdProjects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          deadline: project.deadline,
          status: project.status,
          createdAt: project.createdAt,
          teamMembers: project.assignments.map((assignment) => ({
            userId: assignment.user.id,
            email: assignment.user.email,
            name: `${assignment.user.firstName} ${assignment.user.lastName}`,
            role: assignment.user.role,
            assignedAt: assignment.assignedAt,
          })),
          documentsCount: project.documents.length,
          documents: project.documents,
        })),
        assigned: safeUserData.projectAssignments.map((assignment) => ({
          assignmentId: assignment.id,
          assignedAt: assignment.assignedAt,
          project: assignment.project,
        })),
      },
      documents: {
        uploaded: safeUserData.uploadedDocuments.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          originalFilename: doc.originalFilename,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: doc.uploadedAt,
          storageProvider: doc.storageProvider,
          project: doc.project,
        })),
        totalCount: safeUserData.uploadedDocuments.length,
        totalSize: safeUserData.uploadedDocuments.reduce(
          (sum, doc) => sum + doc.fileSize,
          0
        ),
      },
      statistics: {
        projectsCreated: safeUserData.createdProjects.length,
        projectsAssigned: safeUserData.projectAssignments.length,
        documentsUploaded: safeUserData.uploadedDocuments.length,
        totalStorageUsed: safeUserData.uploadedDocuments.reduce(
          (sum, doc) => sum + doc.fileSize,
          0
        ),
      },
    };

    // Create JSON blob
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = Buffer.from(jsonString, "utf-8");

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="pixelforge-data-${new Date().toISOString().split("T")[0]}.json"`,
        "Content-Length": blob.length.toString(),
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
