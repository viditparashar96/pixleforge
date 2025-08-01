"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects } from "@/lib/actions/projects";
import { getUsers } from "@/lib/actions/users";
import { Users, FolderOpen, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalProjects?: number;
  activeProjects?: number;
  totalUsers?: number;
  myProjects?: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session) return;

      try {
        const [projectsResult, usersResult] = await Promise.all([
          getProjects(),
          session.user.role === "ADMIN" ? getUsers() : Promise.resolve({ success: false, data: [] }),
        ]);

        const newStats: DashboardStats = {};

        if (projectsResult.success && projectsResult.data) {
          const projects = projectsResult.data;
          newStats.totalProjects = projects.length;
          newStats.activeProjects = projects.filter(p => p.status === "ACTIVE").length;
          
          if (session.user.role === "DEVELOPER") {
            newStats.myProjects = projects.length; // For developers, getProjects already filters to their assigned projects
          }
        }

        if (usersResult.success && usersResult.data) {
          newStats.totalUsers = usersResult.data.length;
        }

        setStats(newStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [session]);

  if (!session) return null;

  const role = session.user.role;
  const userName = session.user.firstName;

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-0 gradient-hero opacity-20 rounded-3xl"></div>
        <div className="relative glass p-8 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Welcome back, {userName}!
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Ready to create something amazing? Here&apos;s your project overview.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center animate-glow">
                  <TrendingUp className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {role === "ADMIN" && (
          <>
            <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Total Users</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-chart-1" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {loading ? (
                    <div className="w-12 h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stats.totalUsers || 0
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Active developers in your organization
                </p>
              </CardContent>
            </Card>
            <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Total Projects</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {loading ? (
                    <div className="w-12 h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stats.totalProjects || 0
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Games and applications in development
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {(role === "ADMIN" || role === "PROJECT_LEAD") && (
          <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Active Projects</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <div className="w-12 h-8 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.activeProjects || 0
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Projects currently in active development
              </p>
            </CardContent>
          </Card>
        )}

        {role === "DEVELOPER" && (
          <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">My Projects</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <div className="w-12 h-8 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.myProjects || 0
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Projects assigned to your expertise
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">This Month</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Current development cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(role === "ADMIN" || role === "PROJECT_LEAD") && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-chart-2" />
                  Project Management
                </h4>
                <div className="space-y-3 pl-6">
                  <Link
                    href="/dashboard/projects/new"
                    className="block p-3 rounded-xl bg-accent/20 hover:bg-accent/40 transition-all duration-200 feature-highlight"
                  >
                    <div className="font-medium text-foreground">Create New Project</div>
                    <div className="text-sm text-muted-foreground">Start a new game development project</div>
                  </Link>
                  <Link
                    href="/dashboard/projects"
                    className="block p-3 rounded-xl bg-accent/20 hover:bg-accent/40 transition-all duration-200 feature-highlight"
                  >
                    <div className="font-medium text-foreground">View All Projects</div>
                    <div className="text-sm text-muted-foreground">Monitor project progress and status</div>
                  </Link>
                </div>
              </div>
            )}

            {role === "ADMIN" && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-chart-1" />
                  User Management
                </h4>
                <div className="space-y-3 pl-6">
                  <a
                    href="/dashboard/admin/users/new"
                    className="block p-3 rounded-xl bg-accent/20 hover:bg-accent/40 transition-all duration-200 feature-highlight"
                  >
                    <div className="font-medium text-foreground">Create New User</div>
                    <div className="text-sm text-muted-foreground">Add developers to your team</div>
                  </a>
                  <a
                    href="/dashboard/admin/users"
                    className="block p-3 rounded-xl bg-accent/20 hover:bg-accent/40 transition-all duration-200 feature-highlight"
                  >
                    <div className="font-medium text-foreground">Manage Users</div>
                    <div className="text-sm text-muted-foreground">Control access and permissions</div>
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-chart-4" />
                General
              </h4>
              <div className="pl-6">
                <Link
                  href="/dashboard/projects"
                  className="block p-3 rounded-xl bg-accent/20 hover:bg-accent/40 transition-all duration-200 feature-highlight"
                >
                  <div className="font-medium text-foreground">View My Projects</div>
                  <div className="text-sm text-muted-foreground">Access your assigned projects</div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-chart-5" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-foreground font-medium mb-2">
                Your Activity Timeline
              </div>
              <div className="text-sm text-muted-foreground max-w-sm mx-auto">
                Project updates, team collaborations, and development milestones will appear here as you work on your games.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}