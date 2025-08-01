"use client"

import { Project, User, ProjectAssignment } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Calendar, User2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { EditProjectButton } from "./edit-project-button"
import { DeleteProjectButton } from "./delete-project-button"
import { formatDistanceToNow } from "date-fns"

type ProjectWithDetails = Project & {
  assignments: (ProjectAssignment & {
    user: User
  })[]
  createdBy: User
}

interface ProjectHeaderProps {
  project: ProjectWithDetails
  userRole: string
}

export function ProjectHeader({ project, userRole }: ProjectHeaderProps) {
  const router = useRouter()
  
  const getStatusBadge = () => {
    return project.status === "ACTIVE" ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        Completed
      </Badge>
    )
  }

  const getDeadlineBadge = () => {
    const now = new Date()
    const deadline = new Date(project.deadline)
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDeadline < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (daysUntilDeadline <= 3) {
      return <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Due Soon</Badge>
    } else if (daysUntilDeadline <= 7) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Due This Week</Badge>
    }
    return null
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {getStatusBadge()}
            {getDeadlineBadge()}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User2 className="h-4 w-4" />
              <span>Created by {project.createdBy.firstName} {project.createdBy.lastName}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {userRole === "ADMIN" && (
        <div className="flex items-center gap-2">
          <EditProjectButton project={project} />
          <DeleteProjectButton project={project} />
        </div>
      )}
    </div>
  )
}