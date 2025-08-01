import { ProjectActions } from "@/components/dashboard/project-actions";
import { ProjectDocuments } from "@/components/dashboard/project-documents";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TeamMembers } from "@/components/dashboard/team-members";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/actions/auth";
import { getProjectDocuments } from "@/lib/actions/documents-helper";
import { getProjectById } from "@/lib/actions/projects";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, FileText, User as UserIcon, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const projectResult = await getProjectById(id);

  if (!projectResult.success || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data;

  // Check if user has access to this project
  const hasAccess =
    user.role === "ADMIN" ||
    project.assignments.some((assignment) => assignment.userId === user.id) ||
    project.createdById === user.id;

  if (!hasAccess) {
    redirect("/dashboard/projects");
  }

  const documents = await getProjectDocuments(id);

  return (
    <div className="space-y-6">
      {/* @ts-expect-error - Type mismatch between backend response and component expectation */}
      <ProjectHeader project={project} userRole={user.role} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created by</p>
                    <p className="text-sm text-muted-foreground">
                      {project.createdBy.firstName} {project.createdBy.lastName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.assignments.length} team member
                    {project.assignments.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {documents.length} document
                    {documents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <Badge
                  variant={
                    project.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {project.status === "ACTIVE" ? "Active" : "Completed"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <ProjectDocuments
            documents={documents}
            projectId={project.id}
            userRole={user.role}
            canUpload={
              user.role === "ADMIN" ||
              (user.role === "PROJECT_LEAD" &&
                project.createdById === user.id) ||
              project.assignments.some((a) => a.userId === user.id)
            }
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <TeamMembers
            // @ts-expect-error - Type mismatch between backend response and component expectation
            assignments={project.assignments}
            projectId={project.id}
            canManageTeam={
              user.role === "ADMIN" ||
              (user.role === "PROJECT_LEAD" && project.createdById === user.id)
            }
          />

          {/* Actions */}
          {(user.role === "ADMIN" ||
            (user.role === "PROJECT_LEAD" &&
              project.createdById === user.id)) && (
            <ProjectActions project={project} />
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Project created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(project.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-muted rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">
                    Deadline{" "}
                    {new Date(project.deadline) > new Date()
                      ? "approaching"
                      : "passed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(project.deadline), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
