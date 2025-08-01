"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit } from "lucide-react"
import { updateUser } from "@/lib/actions/users-new"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { User } from "@prisma/client"

interface EditUserButtonProps {
  user: User
}

export function EditUserButton({ user }: EditUserButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    try {
      // Add the user id and MFA status to formData
      formData.set("id", user.id)
      formData.set("mfaEnabled", mfaEnabled.toString())
      
      await updateUser(formData)
      toast.success("User updated successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.firstName}
                placeholder="Enter first name"
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
                placeholder="Enter last name"
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
              placeholder="Enter email address"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue={user.role} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
                <SelectItem value="PROJECT_LEAD">Project Lead</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mfaEnabled"
              checked={mfaEnabled}
              onCheckedChange={setMfaEnabled}
              disabled={isLoading}
            />
            <Label htmlFor="mfaEnabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable Multi-Factor Authentication
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password (optional)</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Leave blank to keep current password"
              minLength={8}
              maxLength={128}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Only enter a new password if you want to change it
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}