"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeUserFromProject } from "@/lib/actions/projects";
import { ProjectAssignment, User } from "@prisma/client";
import { Mail, Minus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AssignUserDialog } from "./assign-user-dialog";

type AssignmentWithUser = ProjectAssignment & {
  user: User;
};

interface TeamMembersProps {
  assignments: AssignmentWithUser[];
  projectId: string;
  canManageTeam: boolean;
}

export function TeamMembers({
  assignments,
  projectId,
  canManageTeam,
}: TeamMembersProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${userName} from this project?`)
    ) {
      return;
    }

    setIsLoading(userId);

    try {
      const result = await removeUserFromProject({
        projectId,
        userId,
      });

      if (result.success) {
        toast.success(`${userName} removed from project`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove user");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove user"
      );
    } finally {
      setIsLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge variant="destructive" className="text-xs">
            Admin
          </Badge>
        );
      case "PROJECT_LEAD":
        return (
          <Badge variant="default" className="text-xs">
            Lead
          </Badge>
        );
      case "DEVELOPER":
        return (
          <Badge variant="secondary" className="text-xs">
            Developer
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({assignments.length})
          </CardTitle>
          {canManageTeam && (
            <AssignUserDialog 
              projectId={projectId} 
              assignedUserIds={assignments.map(a => a.userId)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No team members assigned yet
            </p>
            {canManageTeam && (
              <AssignUserDialog 
                projectId={projectId} 
                assignedUserIds={assignments.map(a => a.userId)}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {assignment.user.firstName[0]}
                      {assignment.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {assignment.user.firstName} {assignment.user.lastName}
                      </p>
                      {getRoleBadge(assignment.user.role)}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{assignment.user.email}</span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Assigned{" "}
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {canManageTeam && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      handleRemoveUser(
                        assignment.user.id,
                        `${assignment.user.firstName} ${assignment.user.lastName}`
                      )
                    }
                    disabled={isLoading === assignment.user.id}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
