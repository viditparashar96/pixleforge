import { NextRequest, NextResponse } from "next/server";
import { uploadDocumentToImageKit } from "@/lib/actions/documents-imagekit";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await uploadDocumentToImageKit(formData);

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