"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  UpdateUserSchema,
  IdSchema,
  type UpdateUserInput,
} from "@/lib/validations";

export async function getUsers() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Only administrators can view users.",
      };
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        mfaEnabled: true,
        _count: {
          select: {
            projectAssignments: true,
            createdProjects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Get users error:", error);
    return {
      success: false,
      error: "Failed to fetch users.",
    };
  }
}

export async function getUserById(id: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(id);

    // Check permissions
    const isAdmin = session.user.role === "ADMIN";
    const isOwnProfile = session.user.id === validatedId;

    if (!isAdmin && !isOwnProfile) {
      return {
        success: false,
        error: "Unauthorized. You can only view your own profile.",
      };
    }

    const user = await db.user.findUnique({
      where: {
        id: validatedId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        mfaEnabled: true,
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                deadline: true,
              },
            },
          },
        },
        createdProjects: {
          select: {
            id: true,
            name: true,
            status: true,
            deadline: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found.",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Get user by ID error:", error);
    return {
      success: false,
      error: "Failed to fetch user.",
    };
  }
}

export async function updateUser(id: string, data: UpdateUserInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    // Validate ID and data
    const validatedId = IdSchema.parse(id);
    const validatedData = UpdateUserSchema.parse(data);

    // Check permissions
    const isAdmin = session.user.role === "ADMIN";
    const isOwnProfile = session.user.id === validatedId;

    // Only admins can update roles and other users' profiles
    if (validatedData.role && !isAdmin) {
      return {
        success: false,
        error: "Unauthorized. Only administrators can update user roles.",
      };
    }

    if (!isAdmin && !isOwnProfile) {
      return {
        success: false,
        error: "Unauthorized. You can only update your own profile.",
      };
    }

    // Check if email is already taken (if updating email)
    if (validatedData.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validatedData.email.toLowerCase(),
          NOT: {
            id: validatedId,
          },
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: "A user with this email already exists.",
        };
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: {
        id: validatedId,
      },
      data: {
        ...(validatedData.email && { email: validatedData.email.toLowerCase() }),
        ...(validatedData.firstName && { firstName: validatedData.firstName }),
        ...(validatedData.lastName && { lastName: validatedData.lastName }),
        ...(validatedData.role && isAdmin && { role: validatedData.role }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/users/${id}`);

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      error: "Failed to update user.",
    };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Only administrators can delete users.",
      };
    }

    // Validate ID
    const validatedId = IdSchema.parse(id);

    // Prevent admin from deleting themselves
    if (session.user.id === validatedId) {
      return {
        success: false,
        error: "You cannot delete your own account.",
      };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        _count: {
          select: {
            createdProjects: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found.",
      };
    }

    // Check if user has created projects
    if (user._count.createdProjects > 0) {
      return {
        success: false,
        error: "Cannot delete user who has created projects. Please reassign projects first.",
      };
    }

    // Delete user (assignments will be deleted due to cascade)
    await db.user.delete({
      where: {
        id: validatedId,
      },
    });

    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message: "User deleted successfully.",
    };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      success: false,
      error: "Failed to delete user.",
    };
  }
}

export async function getDevelopers() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "PROJECT_LEAD"].includes(session.user.role)) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    const developers = await db.user.findMany({
      where: {
        role: "DEVELOPER",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    return {
      success: true,
      data: developers,
    };
  } catch (error) {
    console.error("Get developers error:", error);
    return {
      success: false,
      error: "Failed to fetch developers.",
    };
  }
}