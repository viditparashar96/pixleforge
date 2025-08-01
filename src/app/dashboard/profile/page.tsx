import { getCurrentUser } from "@/lib/actions/auth"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { PasswordChangeCard } from "@/components/dashboard/password-change-card"
import { ActivityCard } from "@/components/dashboard/activity-card"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileCard user={user} />
          <PasswordChangeCard />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <ActivityCard user={user} />
        </div>
      </div>
    </div>
  )
}