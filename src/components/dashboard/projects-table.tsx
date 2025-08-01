"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Document,
  Project,
  ProjectAssignment,
  ProjectStatus,
  User,
} from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Eye, FileText, Search, Users } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { DeleteProjectButton } from "./delete-project-button";
import { EditProjectButton } from "./edit-project-button";

type ProjectWithDetails = Project & {
  assignments: (ProjectAssignment & {
    user: User;
  })[];
  documents: Document[];
  createdBy: User;
};

interface ProjectsTableProps {
  projects: ProjectWithDetails[];
  userRole: string;
  currentUserId?: string;
}

export function ProjectsTable({
  projects,
  userRole,
  currentUserId,
}: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("deadline");
  console.log("ProjectsTable rendered with projects:", projects);
  // Safe array handling with multiple checks
  const safeProjects = React.useMemo(() => {
    if (!projects) return [];
    if (!Array.isArray(projects)) return [];
    return projects.filter(Boolean); // Remove any null/undefined items
  }, [projects]);

  const filteredProjects = safeProjects
    .filter((project) => {
      if (!project) return false;

      const projectName = project.name || "";
      const projectDescription = project.description || "";

      const matchesSearch =
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!a || !b) return 0;

      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "deadline":
          const aDeadline = a.deadline ? new Date(a.deadline).getTime() : 0;
          const bDeadline = b.deadline ? new Date(b.deadline).getTime() : 0;
          return aDeadline - bDeadline;
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: ProjectStatus) => {
    return status === "ACTIVE" ? (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 hover:bg-green-100"
      >
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        Completed
      </Badge>
    );
  };

  const getDeadlineBadge = (deadline: Date) => {
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntilDeadline <= 3) {
      return (
        <Badge
          variant="destructive"
          className="bg-orange-100 text-orange-800 hover:bg-orange-100"
        >
          Due Soon
        </Badge>
      );
    } else if (daysUntilDeadline <= 7) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Due This Week
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">
              {(filteredProjects || []).length} project
              {(filteredProjects || []).length !== 1 ? "s" : ""} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created by {project.createdBy.firstName}{" "}
                      {project.createdBy.lastName}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(project.status)}
                    {getDeadlineBadge(new Date(project.deadline))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {project.assignments?.length || 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {project.documents?.length || 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {new Date(project.deadline).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(project.deadline), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(project.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {(userRole === "ADMIN" ||
                      (userRole === "PROJECT_LEAD" &&
                        project.createdById === currentUserId)) && (
                      <>
                        <EditProjectButton project={project} />
                        <DeleteProjectButton project={project} />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredProjects.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No projects found matching your search criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
