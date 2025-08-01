import { CreateProjectButton } from "@/components/dashboard/create-project-button";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { ProjectsTableSkeleton } from "@/components/dashboard/projects-table-skeleton";
import { getCurrentUser } from "@/lib/actions/auth";
import { getProjects } from "@/lib/actions/projects";
import { FolderOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProjectsPage() {
  try {
    const user = await getCurrentUser();

    console.log("Current user:", user);

    if (!user) {
      redirect("/auth/signin");
      return null;
    }

    // Get projects using the unified getProjects function
    const projectsResult = await getProjects();
    console.log("Projects result:", projectsResult);

    // Extract projects with multiple safety checks - ensure it's always an array
    let safeProjects: unknown[] = [];
    if (projectsResult && projectsResult.success && projectsResult.data) {
      safeProjects = Array.isArray(projectsResult.data)
        ? projectsResult.data
        : [];
    }

    console.log(
      "Safe projects:",
      safeProjects,
      "Type:",
      typeof safeProjects,
      "Length:",
      safeProjects?.length || 0
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              {user.role === "ADMIN"
                ? "Manage all projects in the system"
                : user.role === "PROJECT_LEAD"
                ? "Manage your assigned projects"
                : "View your assigned projects"}
            </p>
          </div>

          {(user?.role === "ADMIN" || user?.role === "PROJECT_LEAD") && (
            <CreateProjectButton />
          )}
        </div>

        {!projectsResult || !projectsResult.success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-red-600">
              Error Loading Projects
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {projectsResult?.error ||
                "There was an error loading the projects. Please try refreshing the page."}
            </p>
          </div>
        ) : safeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {user?.role === "ADMIN"
                ? "Get started by creating your first project"
                : user?.role === "PROJECT_LEAD"
                ? "Get started by creating your first project"
                : "You haven't been assigned to any projects yet"}
            </p>
            {(user?.role === "ADMIN" || user?.role === "PROJECT_LEAD") && (
              <CreateProjectButton variant="default" />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Suspense fallback={<ProjectsTableSkeleton />}>
              {(() => {
                try {
                  // Ensure projects is always an array with multiple safety checks
                  const projects = Array.isArray(safeProjects)
                    ? safeProjects
                    : [];
                  console.log(
                    "Rendering ProjectsTable with projects:",
                    projects,
                    "Type:",
                    typeof projects,
                    "Length:",
                    projects?.length || 0
                  );

                  // Additional safety check
                  if (!Array.isArray(projects)) {
                    console.error("Projects is not an array:", projects);
                    return (
                      <div className="text-center py-8">
                        <p className="text-red-600">
                          Error: Invalid projects data
                        </p>
                      </div>
                    );
                  }

                  return (
                    <ProjectsTable
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      projects={projects as any}
                      userRole={user?.role || "DEVELOPER"}
                      currentUserId={user?.id}
                    />
                  );
                } catch (error) {
                  console.error("ProjectsTable render error:", error);
                  return (
                    <div className="text-center py-8">
                      <p className="text-red-600">
                        Error rendering projects table
                      </p>
                    </div>
                  );
                }
              })()}
            </Suspense>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Projects page error:", error);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium mb-2 text-red-600">
          Error Loading Projects
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          There was an error loading the projects page. Please try refreshing.
        </p>
      </div>
    );
  }
}
