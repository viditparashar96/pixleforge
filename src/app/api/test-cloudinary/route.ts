import {
  generateCloudinaryUrl,
  generateDirectCloudinaryUrl,
  generateUnsignedCloudinaryUrl,
} from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publicId = searchParams.get("publicId");

  if (!publicId) {
    return NextResponse.json(
      { error: "publicId parameter required" },
      { status: 400 }
    );
  }

  try {
    // Test different URL generation methods
    const directUrl = generateDirectCloudinaryUrl(publicId, "raw");
    const unsignedUrl = generateUnsignedCloudinaryUrl(publicId, "raw");
    const signedUrl = generateCloudinaryUrl(publicId, { resourceType: "raw" });

    // Test if the URLs are accessible
    const testResults = {
      publicId,
      urls: {
        direct: directUrl,
        unsigned: unsignedUrl,
        signed: signedUrl,
      },
      tests: {
        direct: null as any,
        unsigned: null as any,
        signed: null as any,
      },
    };

    // Test each URL
    try {
      const directResponse = await fetch(directUrl, { method: "HEAD" });
      testResults.tests.direct = {
        status: directResponse.status,
        ok: directResponse.ok,
        headers: Object.fromEntries(directResponse.headers.entries()),
      };
    } catch (error: any) {
      testResults.tests.direct = { error: error.message };
    }

    try {
      const unsignedResponse = await fetch(unsignedUrl, { method: "HEAD" });
      testResults.tests.unsigned = {
        status: unsignedResponse.status,
        ok: unsignedResponse.ok,
        headers: Object.fromEntries(unsignedResponse.headers.entries()),
      };
    } catch (error: any) {
      testResults.tests.unsigned = { error: error.message };
    }

    try {
      const signedResponse = await fetch(signedUrl, { method: "HEAD" });
      testResults.tests.signed = {
        status: signedResponse.status,
        ok: signedResponse.ok,
        headers: Object.fromEntries(signedResponse.headers.entries()),
      };
    } catch (error: any) {
      testResults.tests.signed = { error: error.message };
    }

    return NextResponse.json(testResults);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
