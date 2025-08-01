"use server"

import { getCurrentUser } from "./auth"
import { db } from "@/lib/db"
import { hash, compare } from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    throw new Error("Unauthorized")
  }

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const mfaEnabled = formData.get("mfaEnabled") === "true"

  if (!firstName || !lastName || !email) {
    throw new Error("Missing required fields")
  }

  // Check if email is already taken by another user
  const existingUser = await db.user.findFirst({
    where: {
      email: email.toLowerCase(),
      NOT: {
        id: currentUser.id,
      },
    },
  })

  if (existingUser) {
    throw new Error("A user with this email already exists")
  }

  await db.user.update({
    where: { id: currentUser.id },
    data: {
      firstName,
      lastName,
      email: email.toLowerCase(),
      mfaEnabled,
    },
  })

  revalidatePath("/dashboard/profile")
}

export async function changePassword(formData: FormData) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    throw new Error("Unauthorized")
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string

  if (!currentPassword || !newPassword) {
    throw new Error("Missing required fields")
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long")
  }

  // Get current user with password hash
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    select: { passwordHash: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Verify current password
  const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash)
  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect")
  }

  // Hash new password
  const newPasswordHash = await hash(newPassword, 12)

  // Update password
  await db.user.update({
    where: { id: currentUser.id },
    data: {
      passwordHash: newPasswordHash,
    },
  })

  revalidatePath("/dashboard/profile")
}

export async function getUserActivity() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    throw new Error("Unauthorized")
  }

  const activity = await db.user.findUnique({
    where: { id: currentUser.id },
    include: {
      _count: {
        select: {
          projectAssignments: true,
          createdProjects: true,
          uploadedDocuments: true,
        },
      },
    },
  })

  if (!activity) {
    throw new Error("User not found")
  }

  return {
    assignedProjects: activity._count.projectAssignments,
    createdProjects: activity._count.createdProjects,
    uploadedDocuments: activity._count.uploadedDocuments,
  }
}