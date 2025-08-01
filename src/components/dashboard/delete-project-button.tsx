"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteProject } from "@/lib/actions/projects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Project } from "@prisma/client"

interface DeleteProjectButtonProps {
  project: Project
  children?: React.ReactNode
}

export function DeleteProjectButton({ project, children }: DeleteProjectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)
    
    try {
      const result = await deleteProject(project.id);
      
      if (result.success) {
        toast.success(result.message || "Project deleted successfully");
        router.push("/dashboard/projects"); // Navigate back to projects list
      } else {
        toast.error(result.error || "Failed to delete project");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
            All project assignments and documents will also be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}