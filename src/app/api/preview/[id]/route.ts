import { authOptions } from "@/lib/auth";
import { generateDirectCloudinaryUrl } from "@/lib/cloudinary";
import { generateDirectImageKitUrl } from "@/lib/imagekit";
import { db } from "@/lib/db";
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

    // Get document from database
    const document = await db.document.findUnique({
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

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isProjectCreator = document.project.createdById === session.user.id;
    const isAssigned = document.project.assignments.length > 0;

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

    if (!previewableMimeTypes.includes(document.mimeType)) {
      return NextResponse.json(
        { error: "File type not previewable" },
        { status: 400 }
      );
    }

    console.log('Document preview request:', {
      id: documentId,
      storageProvider: document.storageProvider,
      imagekitUrl: document.imagekitUrl,
      imagekitFilePath: document.imagekitFilePath,
      cloudinaryUrl: document.cloudinaryUrl,
      cloudinaryPublicId: document.cloudinaryPublicId,
      mimeType: document.mimeType
    });

    // Handle based on storage provider
    if (document.storageProvider === "imagekit" && document.imagekitUrl) {
      // For ImageKit documents, use the direct URL
      const directUrl = generateDirectImageKitUrl(document.imagekitFilePath || "");
      
      console.log('Generated ImageKit URL:', directUrl);
      
      if (!directUrl) {
        console.error('ImageKit URL generation failed for path:', document.imagekitFilePath);
        return NextResponse.json(
          { error: "Preview URL generation failed", path: document.imagekitFilePath },
          { status: 500 }
        );
      }
      
      return NextResponse.redirect(directUrl, 302);
    } else if (document.storageProvider === "cloudinary" && document.cloudinaryUrl) {
      // For Cloudinary documents (legacy)
      let directUrl: string;
      
      if (
        document.mimeType.startsWith("image/") ||
        document.mimeType === "application/pdf"
      ) {
        // Try direct URL first for untrusted accounts
        directUrl = generateDirectCloudinaryUrl(
          document.cloudinaryPublicId || "",
          document.mimeType.startsWith("image/") ? "image" : "raw"
        );
      } else {
        // For other file types, use direct URL
        directUrl = generateDirectCloudinaryUrl(
          document.cloudinaryPublicId || "",
          "raw"
        );
      }
      
      console.log('Generated Cloudinary URL:', directUrl);
      
      if (!directUrl) {
        console.error('Cloudinary URL generation failed for publicId:', document.cloudinaryPublicId);
        return NextResponse.json(
          { error: "Preview URL generation failed", publicId: document.cloudinaryPublicId },
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
