import { NextRequest, NextResponse } from "next/server";
import { uploadDocumentVersion } from "@/lib/actions/documents-versioned";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract version control options from form data
    const documentGroupId = formData.get("documentGroupId") as string | null;
    const versionNotes = formData.get("versionNotes") as string | null;
    const replaceLatest = formData.get("replaceLatest") === "true";

    const options = {
      documentGroupId: documentGroupId || undefined,
      versionNotes: versionNotes || undefined,
      replaceLatest,
    };

    const result = await uploadDocumentVersion(formData, options);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}