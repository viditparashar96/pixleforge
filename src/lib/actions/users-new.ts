"use server"

import { getCurrentUser } from "./auth"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function getAllUsers() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized. Only administrators can view users.")
  }

  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return users
}

export async function updateUser(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized. Only administrators can update users.")
  }

  const id = formData.get("id") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as "ADMIN" | "PROJECT_LEAD" | "DEVELOPER"
  const mfaEnabled = formData.get("mfaEnabled") === "true"
  const newPassword = formData.get("newPassword") as string

  if (!id || !firstName || !lastName || !email || !role) {
    throw new Error("Missing required fields")
  }

  // Check if email is already taken by another user
  const existingUser = await db.user.findFirst({
    where: {
      email: email.toLowerCase(),
      NOT: {
        id,
      },
    },
  })

  if (existingUser) {
    throw new Error("A user with this email already exists")
  }

  const updateData: Record<string, string | boolean> = {
    firstName,
    lastName,
    email: email.toLowerCase(),
    role,
    mfaEnabled,
  }

  // Only update password if provided
  if (newPassword && newPassword.trim()) {
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }
    updateData.passwordHash = await hash(newPassword, 12)
  }

  await db.user.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/dashboard/admin/users")
}

export async function deleteUser(id: string) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized. Only administrators can delete users.")
  }

  if (currentUser.id === id) {
    throw new Error("You cannot delete your own account")
  }

  // Check if user has created projects
  const user = await db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          createdProjects: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  if (user._count.createdProjects > 0) {
    throw new Error("Cannot delete user who has created projects. Please reassign projects first.")
  }

  await db.user.delete({
    where: { id },
  })

  revalidatePath("/dashboard/admin/users")
}

export async function getDevelopers() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || !["ADMIN", "PROJECT_LEAD"].includes(currentUser.role)) {
    throw new Error("Unauthorized")
  }

  const developers = await db.user.findMany({
    where: {
      OR: [
        { role: "DEVELOPER" },
        { role: "PROJECT_LEAD" },
      ],
    },
    orderBy: {
      firstName: "asc",
    },
  })

  return developers
}