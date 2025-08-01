import { getCurrentUser } from "@/lib/actions/auth"
import { CreateProjectForm } from "@/components/dashboard/create-project-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function NewProjectPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  if (!["ADMIN", "PROJECT_LEAD"].includes(user.role)) {
    redirect("/dashboard/projects")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new game development project
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CreateProjectForm />
      </div>
    </div>
  )
}