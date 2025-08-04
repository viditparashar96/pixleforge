import { authOptions } from "@/lib/auth";
import { generateDirectCloudinaryUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { generateDirectImageKitUrl } from "@/lib/imagekit";
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

    const { id } = await params;
    const documentId = id;

    // Try to find document version first (new system)
    const documentVersion = await db.documentVersion.findUnique({
      where: {
        id: documentId,
      },
      include: {
        documentGroup: {
          include: {
            project: {
              include: {
                assignments: {
                  where: {
                    userId: session.user.id,
                  },
                },
                createdBy: true,
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
          id: documentId,
        },
        include: {
          project: {
            include: {
              assignments: {
                where: {
                  userId: session.user.id,
                },
              },
              createdBy: true,
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
    const isProjectCreator = project.createdById === session.user.id;
    const isAssigned = project.assignments.length > 0;

    if (!isAdmin && !isProjectCreator && !isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if file type is previewable
    const previewableMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "text/plain",
    ];

    if (!previewableMimeTypes.includes(currentDoc.mimeType)) {
      return NextResponse.json(
        { error: "File type not previewable" },
        { status: 400 }
      );
    }

    console.log("Document preview request:", {
      id: documentId,
      isVersioned: !!documentVersion,
      storageProvider: currentDoc.storageProvider,
      imagekitUrl: currentDoc.imagekitUrl,
      imagekitFilePath: currentDoc.imagekitFilePath,
      cloudinaryUrl: currentDoc.cloudinaryUrl,
      cloudinaryPublicId: currentDoc.cloudinaryPublicId,
      mimeType: currentDoc.mimeType,
    });

    // Handle based on storage provider
    if (currentDoc.storageProvider === "imagekit" && currentDoc.imagekitUrl) {
      // For ImageKit documents, use the direct URL
      const directUrl = generateDirectImageKitUrl(
        currentDoc.imagekitFilePath || ""
      );

      console.log("Generated ImageKit URL:", directUrl);

      if (!directUrl) {
        console.error(
          "ImageKit URL generation failed for path:",
          currentDoc.imagekitFilePath
        );
        return NextResponse.json(
          {
            error: "Preview URL generation failed",
            path: currentDoc.imagekitFilePath,
          },
          { status: 500 }
        );
      }

      return NextResponse.redirect(directUrl, 302);
    } else if (
      currentDoc.storageProvider === "cloudinary" &&
      currentDoc.cloudinaryUrl
    ) {
      // For Cloudinary documents (legacy)
      let directUrl: string;

      if (
        currentDoc.mimeType.startsWith("image/") ||
        currentDoc.mimeType === "application/pdf"
      ) {
        // Try direct URL first for untrusted accounts
        // @ts-expect-error - generateDirectCloudinaryUrl may not be typed correctly
        directUrl = generateDirectCloudinaryUrl(
          currentDoc.cloudinaryPublicId || "",
          currentDoc.mimeType.startsWith("image/") ? "image" : "raw"
        );
      } else {
        // For other file types, use direct URL
        // @ts-expect-error - generateDirectCloudinaryUrl may not be typed correctly
        directUrl = generateDirectCloudinaryUrl(
          currentDoc.cloudinaryPublicId || "",
          "raw"
        );
      }

      console.log("Generated Cloudinary URL:", directUrl);

      if (!directUrl) {
        console.error(
          "Cloudinary URL generation failed for publicId:",
          currentDoc.cloudinaryPublicId
        );
        return NextResponse.json(
          {
            error: "Preview URL generation failed",
            publicId: currentDoc.cloudinaryPublicId,
          },
          { status: 500 }
        );
      }

      // Redirect to the direct Cloudinary URL
      return NextResponse.redirect(directUrl, 302);
    } else {
      // Handle legacy documents or documents without proper URLs
      return NextResponse.json(
        { error: "Preview not available - missing storage information" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
