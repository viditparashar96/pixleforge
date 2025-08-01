import { User } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Calendar, FolderOpen, FileText } from "lucide-react"
import { getUserActivity } from "@/lib/actions/profile"

interface ActivityCardProps {
  user: User
}

export async function ActivityCard({ user }: ActivityCardProps) {
  const activity = await getUserActivity()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Account Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Projects Assigned</p>
                <p className="text-xs text-muted-foreground">Active projects</p>
              </div>
            </div>
            <Badge variant="secondary">{activity.assignedProjects}</Badge>
          </div>

          {user.role === "ADMIN" && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <FolderOpen className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Projects Created</p>
                  <p className="text-xs text-muted-foreground">Total created</p>
                </div>
              </div>
              <Badge variant="secondary">{activity.createdProjects}</Badge>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Documents Uploaded</p>
                <p className="text-xs text-muted-foreground">Total uploads</p>
              </div>
            </div>
            <Badge variant="secondary">{activity.uploadedDocuments}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-xs text-muted-foreground">Account age</p>
              </div>
            </div>
            <Badge variant="outline">
              {new Date(user.createdAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Security Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Multi-Factor Authentication</span>
              <Badge variant={user.mfaEnabled ? "default" : "outline"} className="text-xs">
                {user.mfaEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Account Status</span>
              <Badge variant="default" className="text-xs">Active</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}