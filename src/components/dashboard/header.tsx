"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSettingsPanel } from "@/components/ui/theme-settings-panel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  onSidebarToggle?: () => void;
}

export function Header({ onMobileMenuToggle, onSidebarToggle }: HeaderProps) {
  const { data: session } = useSession();

  if (!session) return null;

  const userInitials =
    `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Mobile menu button and desktop sidebar toggle */}
        <div className="flex items-center gap-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          {/* Desktop sidebar toggle - only show when sidebar is available */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={onSidebarToggle}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}
        </div>

        {/* Search and quick actions could go here */}
        <div className="relative flex flex-1 items-center">
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-muted-foreground">
              Welcome to your creative workspace
            </div>
          </div>
        </div>

        {/* User menu and actions */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Theme Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ThemeSettingsPanel />
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-12 rounded-xl hover:bg-accent/50 transition-all duration-200"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="gradient-primary text-primary-foreground font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-chart-4 border-2 border-background"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 glass rounded-2xl border-border/50 shadow-2xl"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full w-fit",
                        session.user.role === "ADMIN" && "role-admin",
                        session.user.role === "PROJECT_LEAD" &&
                          "role-project-lead",
                        session.user.role === "DEVELOPER" && "role-developer"
                      )}
                    >
                      {session.user.role.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <div className="p-2 space-y-1">
                <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-accent/50 cursor-pointer transition-colors">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              <div className="p-2">
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl p-3 focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
