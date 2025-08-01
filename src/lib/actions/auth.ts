"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import {
  CreateUserSchema,
  type CreateUserInput,
} from "@/lib/validations";


export async function createUser(data: CreateUserInput) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can create users
    if (!session || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Only administrators can create users.",
      };
    }

    // Validate input
    const validatedData = CreateUserSchema.parse(data);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        email: validatedData.email.toLowerCase(),
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "A user with this email already exists.",
      };
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Create user error:", error);
    return {
      success: false,
      error: "Failed to create user. Please try again.",
    };
  }
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return null;
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        mfaEnabled: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}