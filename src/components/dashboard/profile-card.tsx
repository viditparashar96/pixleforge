"use client"

import { useState } from "react"
import { User } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { UserIcon, Mail, Calendar, Shield, Edit, Save, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { updateProfile } from "@/lib/actions/profile"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProfileCardProps {
  user: User
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    try {
      formData.set("mfaEnabled", mfaEnabled.toString())
      await updateProfile(formData)
      toast.success("Profile updated successfully")
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>
      case "PROJECT_LEAD":
        return <Badge variant="default">Project Lead</Badge>
      case "DEVELOPER":
        return <Badge variant="secondary">Developer</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "PROJECT_LEAD":
        return "bg-blue-100 text-blue-800"
      case "DEVELOPER":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setMfaEnabled(user.mfaEnabled)
                }}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className={`text-lg ${getRoleColor(user.role)}`}>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  {getRoleBadge(user.role)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Created</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(user.createdAt).toLocaleDateString()} 
                    ({formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })})
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Multi-Factor Authentication</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={user.mfaEnabled ? "default" : "outline"}>
                    {user.mfaEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">User ID</Label>
                <div className="text-sm text-muted-foreground font-mono">
                  {user.id}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user.firstName}
                  required
                  maxLength={50}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={user.lastName}
                  required
                  maxLength={50}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mfaEnabled"
                checked={mfaEnabled}
                onCheckedChange={setMfaEnabled}
                disabled={isLoading}
              />
              <Label htmlFor="mfaEnabled" className="text-sm font-medium">
                Enable Multi-Factor Authentication
              </Label>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}