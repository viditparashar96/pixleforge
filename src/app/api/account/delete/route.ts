import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        createdProjects: {
          include: {
            documents: true,
            assignments: true,
          },
        },
        uploadedDocuments: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from deleting their account if they're the only admin
    if (user.role === "ADMIN") {
      const adminCount = await db.user.count({
        where: {
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin account" },
          { status: 400 }
        );
      }
    }

    // Use a transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Delete user's documents (files will remain in storage for cleanup)
      await tx.document.deleteMany({
        where: {
          uploadedById: session.user.id,
        },
      });

      // Delete project assignments
      await tx.projectAssignment.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // Delete assignments made by this user
      await tx.projectAssignment.deleteMany({
        where: {
          assignedById: session.user.id,
        },
      });

      // Delete password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // Delete projects created by the user (cascading will handle related data)
      await tx.project.deleteMany({
        where: {
          createdById: session.user.id,
        },
      });

      // Finally, delete the user account
      await tx.user.delete({
        where: {
          id: session.user.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}