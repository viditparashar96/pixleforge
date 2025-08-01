"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  AssignUserToProjectSchema,
  CreateProjectSchema,
  IdSchema,
  RemoveUserFromProjectSchema,
  UpdateProjectSchema,
  type AssignUserToProjectInput,
  type CreateProjectInput,
  type RemoveUserFromProjectInput,
  type UpdateProjectInput,
} from "@/lib/validations";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function createProject(data: CreateProjectInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "PROJECT_LEAD"].includes(session.user.role)) {
      return {
        success: false,
        error:
          "Unauthorized. Only administrators and project leads can create projects.",
      };
    }

    // Validate input
    const validatedData = CreateProjectSchema.parse(data);

    // Create project
    const project = await db.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        deadline: new Date(validatedData.deadline),
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/projects");

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      success: false,
      error: "Failed to create project. Please try again.",
    };
  }
}

export async function getProjects() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    let projects;

    if (session.user.role === "ADMIN") {
      // Admins can see all projects
      projects = await db.project.findMany({
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (session.user.role === "PROJECT_LEAD") {
      // Project leads can see projects they created and projects they're assigned to
      projects = await db.project.findMany({
        where: {
          OR: [
            { createdById: session.user.id },
            {
              assignments: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          ],
        },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Developers can only see projects they're assigned to
      projects = await db.project.findMany({
        where: {
          assignments: {
            some: {
              userId: session.user.id,
            },
          },
        },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return {
      success: true,
      data: projects,
    };
  } catch (error) {
    console.error("Get projects error:", error);
    return {
      success: false,
      data: [],
      error: "Failed to fetch projects.",
    };
  }
}

export async function getProjectById(id: string) {
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

    const project = await db.project.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            assignedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            uploadedAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    // Check access permissions
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;
    const isAssigned = project.assignments.some(
      (assignment) => assignment.userId === session.user.id
    );

    if (!isAdmin && !isCreator && !isAssigned) {
      return {
        success: false,
        error: "Unauthorized. You don't have access to this project.",
      };
    }

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error("Get project by ID error:", error);
    return {
      success: false,
      error: "Failed to fetch project.",
    };
  }
}

export async function updateProject(id: string, data: UpdateProjectInput) {
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
    const validatedData = UpdateProjectSchema.parse(data);

    // Check if project exists and user has permission
    const project = await db.project.findUnique({
      where: {
        id: validatedId,
      },
      select: {
        createdById: true,
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return {
        success: false,
        error:
          "Unauthorized. Only administrators and project creators can update projects.",
      };
    }

    // Update project
    const updatedProject = await db.project.update({
      where: {
        id: validatedId,
      },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description && {
          description: validatedData.description,
        }),
        ...(validatedData.deadline && {
          deadline: new Date(validatedData.deadline),
        }),
        ...(validatedData.status && { status: validatedData.status }),
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            documents: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${id}`);

    return {
      success: true,
      data: updatedProject,
    };
  } catch (error) {
    console.error("Update project error:", error);
    return {
      success: false,
      error: "Failed to update project.",
    };
  }
}

export async function deleteProject(id: string) {
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

    // Check if project exists and user has permission
    const project = await db.project.findUnique({
      where: {
        id: validatedId,
      },
      select: {
        createdById: true,
        name: true,
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return {
        success: false,
        error:
          "Unauthorized. Only administrators and project creators can delete projects.",
      };
    }

    // Delete project (assignments and documents will be deleted due to cascade)
    await db.project.delete({
      where: {
        id: validatedId,
      },
    });

    revalidatePath("/dashboard/projects");

    return {
      success: true,
      message: `Project "${project.name}" deleted successfully.`,
    };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: "Failed to delete project.",
    };
  }
}

export async function assignUsersToProject(data: AssignUserToProjectInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "PROJECT_LEAD"].includes(session.user.role)) {
      return {
        success: false,
        error:
          "Unauthorized. Only administrators and project leads can assign users to projects.",
      };
    }

    // Validate input
    const validatedData = AssignUserToProjectSchema.parse(data);

    // Check if project exists
    const project = await db.project.findUnique({
      where: {
        id: validatedData.projectId,
      },
      select: {
        id: true,
        name: true,
        createdById: true,
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    // Check permission (project leads can only assign to their own projects)
    if (
      session.user.role === "PROJECT_LEAD" &&
      project.createdById !== session.user.id
    ) {
      return {
        success: false,
        error: "You can only assign users to projects you created.",
      };
    }

    // Get existing assignments
    const existingAssignments = await db.projectAssignment.findMany({
      where: {
        projectId: validatedData.projectId,
        userId: {
          in: validatedData.userIds,
        },
      },
      select: {
        userId: true,
      },
    });

    // Filter out already assigned users
    const alreadyAssignedUserIds = existingAssignments.map(
      (assignment) => assignment.userId
    );
    const newUserIds = validatedData.userIds.filter(
      (userId) => !alreadyAssignedUserIds.includes(userId)
    );

    if (newUserIds.length === 0) {
      return {
        success: false,
        error: "All selected users are already assigned to this project.",
      };
    }

    // Create new assignments
    const assignments = await db.projectAssignment.createMany({
      data: newUserIds.map((userId) => ({
        projectId: validatedData.projectId,
        userId,
        assignedById: session.user.id,
      })),
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${validatedData.projectId}`);

    return {
      success: true,
      message: `Successfully assigned ${assignments.count} user(s) to the project.`,
    };
  } catch (error) {
    console.error("Assign users to project error:", error);
    return {
      success: false,
      error: "Failed to assign users to project.",
    };
  }
}

export async function removeUserFromProject(
  data: RemoveUserFromProjectInput | FormData
) {
  try {
    console.log("removeUserFromProject called with:", typeof data, data);

    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "PROJECT_LEAD"].includes(session.user.role)) {
      return {
        success: false,
        error:
          "Unauthorized. Only administrators and project leads can remove users from projects.",
      };
    }

    // Handle both object and FormData inputs
    let validatedData: RemoveUserFromProjectInput;

    if (data instanceof FormData) {
      const projectId = data.get("projectId")?.toString();
      const userId = data.get("userId")?.toString();

      if (!projectId || !userId) {
        return {
          success: false,
          error: "Missing required fields: projectId and userId",
        };
      }

      validatedData = RemoveUserFromProjectSchema.parse({ projectId, userId });
    } else if (typeof data === "string") {
      console.error(
        "ERROR: removeUserFromProject received string instead of object:",
        data
      );
      return {
        success: false,
        error: "Invalid input: expected object with projectId and userId",
      };
    } else {
      // Validate input for regular object
      validatedData = RemoveUserFromProjectSchema.parse(data);
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: {
        id: validatedData.projectId,
      },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    // Check permission (project leads can only remove from their own projects)
    if (
      session.user.role === "PROJECT_LEAD" &&
      project.createdById !== session.user.id
    ) {
      return {
        success: false,
        error: "You can only remove users from projects you created.",
      };
    }

    // Remove assignment
    const deletedAssignment = await db.projectAssignment.deleteMany({
      where: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
      },
    });

    if (deletedAssignment.count === 0) {
      return {
        success: false,
        error: "User is not assigned to this project.",
      };
    }

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${validatedData.projectId}`);

    return {
      success: true,
      message: "User removed from project successfully.",
    };
  } catch (error) {
    console.error("Remove user from project error:", error);
    return {
      success: false,
      error: "Failed to remove user from project.",
    };
  }
}

export async function getUserProjects(userId: string) {
  try {
    console.warn("getUserProjects is deprecated. Use getProjects instead.");

    // Get user to check role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return [];
    }

    let whereClause;

    if (user.role === "PROJECT_LEAD") {
      // Project leads can see projects they created AND projects they're assigned to
      whereClause = {
        OR: [
          { createdById: userId },
          {
            assignments: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      };
    } else {
      // Developers can only see projects they're assigned to
      whereClause = {
        assignments: {
          some: {
            userId: userId,
          },
        },
      };
    }

    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        documents: true,
        _count: {
          select: {
            assignments: true,
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  } catch (error) {
    console.error("Get user projects error:", error);
    return [];
  }
}

export async function getAllProjects() {
  try {
    const projects = await db.project.findMany({
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        documents: true,
        _count: {
          select: {
            assignments: true,
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  } catch (error) {
    console.error("Get all projects error:", error);
    return [];
  }
}
