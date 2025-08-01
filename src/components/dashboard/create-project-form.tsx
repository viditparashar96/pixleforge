"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createProject } from "@/lib/actions/projects"
import { toast } from "sonner"

export function CreateProjectForm() {
  const [date, setDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    if (!date) {
      toast.error("Please select a deadline")
      return
    }

    setIsLoading(true)
    
    try {
      const projectData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        deadline: date.toISOString(),
      }
      
      const result = await createProject(projectData)
      
      if (result.success) {
        toast.success("Project created successfully")
        router.push("/dashboard/projects")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create project")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <CardDescription>
          Enter the basic information for your new game development project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter project name (max 100 characters)"
              required
              maxLength={100}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your game development project (max 500 characters)"
              required
              maxLength={500}
              rows={4}
              disabled={isLoading}
              className="w-full resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Project Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select project deadline</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating Project..." : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}