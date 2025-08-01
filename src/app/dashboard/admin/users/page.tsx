import { Suspense } from "react"
import { getCurrentUser } from "@/lib/actions/auth"
import { getAllUsers } from "@/lib/actions/users-new"
import { UsersTable } from "@/components/dashboard/users-table"
import { UsersTableSkeleton } from "@/components/dashboard/users-table-skeleton"
import { CreateUserButton } from "@/components/dashboard/create-user-button"
import { Button } from "@/components/ui/button"
import { Users, UserPlus } from "lucide-react"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await getAllUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        
        <CreateUserButton />
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Get started by creating the first user account
          </p>
          <CreateUserButton variant="default" />
        </div>
      ) : (
        <div className="space-y-4">
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersTable users={users} currentUserId={user.id} />
          </Suspense>
        </div>
      )}
    </div>
  )
}