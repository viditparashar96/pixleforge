"use client"

import { Project } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Edit, Trash2, Archive, CheckCircle } from "lucide-react"
import { EditProjectButton } from "./edit-project-button"
import { DeleteProjectButton } from "./delete-project-button"
import { updateProject } from "@/lib/actions/projects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProjectActionsProps {
  project: Project
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleStatusToggle = async () => {
    setIsUpdating(true)
    
    try {
      const newStatus = project.status === "ACTIVE" ? "COMPLETED" : "ACTIVE"
      
      const updateData = {
        name: project.name,
        description: project.description,
        deadline: project.deadline.toISOString(),
        status: newStatus,
      };
      
      const result = await updateProject(project.id, updateData);
      
      if (result.success) {
        toast.success(`Project marked as ${newStatus.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update project");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update project")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Project Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-medium">Status Management</p>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleStatusToggle}
            disabled={isUpdating}
          >
            {project.status === "ACTIVE" ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Reactivate Project
              </>
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Project Management</p>
          <div className="space-y-2">
            <EditProjectButton project={project}>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </EditProjectButton>
            
            <DeleteProjectButton project={project}>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </DeleteProjectButton>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}