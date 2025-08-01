import { NextRequest, NextResponse } from "next/server";
import { uploadToImageKit } from "@/lib/imagekit";

export async function GET() {
  try {
    // Test if ImageKit configuration is working
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!urlEndpoint || !publicKey || !privateKey) {
      return NextResponse.json(
        { 
          error: "ImageKit configuration missing",
          config: {
            urlEndpoint: !!urlEndpoint,
            publicKey: !!publicKey,
            privateKey: !!privateKey,
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "ImageKit configuration test successful",
      config: {
        urlEndpoint: urlEndpoint,
        publicKey: publicKey.substring(0, 10) + "...",
        privateKey: "***configured***",
      }
    });
  } catch (error) {
    console.error("ImageKit test error:", error);
    return NextResponse.json(
      { error: "ImageKit test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test file upload to ImageKit
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToImageKit(buffer, file.name, {
      folder: "/pixelforge/test",
      tags: ["test", "api"],
    });

    return NextResponse.json({
      message: "File uploaded successfully to ImageKit",
      result: {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        filePath: result.filePath,
        size: result.size,
      }
    });
  } catch (error) {
    console.error("ImageKit upload test error:", error);
    return NextResponse.json(
      { error: "Upload test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}