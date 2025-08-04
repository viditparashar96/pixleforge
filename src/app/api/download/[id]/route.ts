import { authOptions } from "@/lib/auth";
import { generateDirectCloudinaryUrl } from "@/lib/cloudinary";
import { generateDirectImageKitUrl } from "@/lib/imagekit";
import { db } from "@/lib/db";
import { IdSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate ID
    const { id } = await params;
    const validatedId = IdSchema.parse(id);

    // Try to find document version first (new system)
    const documentVersion = await db.documentVersion.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        documentGroup: {
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
        },
      },
    });

    // If not found, try legacy document system
    let document = null;
    if (!documentVersion) {
      document = await db.document.findUnique({
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
    }

    if (!documentVersion && !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Use documentVersion if available, otherwise use legacy document
    const currentDoc = documentVersion || document!;
    const project = documentVersion ? documentVersion.documentGroup.project : document!.project;

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;
    const isAssigned = project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return NextResponse.json(
        { error: "You don't have permission to download this document" },
        { status: 403 }
      );
    }

    // Handle based on storage provider
    if (currentDoc.storageProvider === "imagekit" && currentDoc.imagekitUrl) {
      // For ImageKit documents, use the direct URL with download disposition
      const downloadUrl = generateDirectImageKitUrl(currentDoc.imagekitFilePath || "");
      
      // ImageKit supports download parameter
      return NextResponse.redirect(
        `${downloadUrl}?ik-attachment=true`
      );
    } else if (currentDoc.storageProvider === "cloudinary" && currentDoc.cloudinaryUrl) {
      // For Cloudinary documents (legacy)
      const downloadUrl = generateDirectCloudinaryUrl(
        currentDoc.cloudinaryPublicId || "",
        currentDoc.mimeType.startsWith("image/") ? "image" : "raw"
      );

      // Redirect to the direct Cloudinary URL with download disposition
      return NextResponse.redirect(
        `${downloadUrl}?fl_attachment=${encodeURIComponent(
          currentDoc.originalFilename
        )}`
      );
    } else {
      // Handle legacy documents or documents without proper URLs
      return NextResponse.json(
        { error: "Document not available for download" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
