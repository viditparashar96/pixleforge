"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FolderOpen,
  Users,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER"] },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen, roles: ["ADMIN", "PROJECT_LEAD", "DEVELOPER"] },
  { name: "Users", href: "/dashboard/admin/users", icon: Users, roles: ["ADMIN"] },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
}

export function Sidebar({ isCollapsed = false, onToggle, isMobile = false, isOpen = false }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(session.user.role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
        isMobile ? (
          isOpen 
            ? "translate-x-0" 
            : "-translate-x-full"
        ) : (
          "hidden lg:flex"
        ),
        isCollapsed && !isMobile ? "lg:w-16" : "lg:w-72",
        isMobile ? "w-72" : ""
      )}>
        <div className="flex grow flex-col gap-y-6 bg-sidebar scrollbar-thin">
          {/* Logo and brand */}
          <div className={cn(
            "flex h-20 shrink-0 items-center pt-6 transition-all duration-300",
            isCollapsed && !isMobile ? "px-3 justify-center" : "px-6"
          )}>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-10 w-10 text-sidebar-primary animate-glow" />
                <div className="absolute inset-0 h-10 w-10 animate-pulse opacity-50">
                  <Shield className="h-10 w-10 text-sidebar-primary" />
                </div>
              </div>
              {(!isCollapsed || isMobile) && (
                <div>
                  <h1 className="text-lg font-bold text-sidebar-foreground">
                    PixelForge
                  </h1>
                  <p className="text-sm font-semibold text-sidebar-primary">
                    Nexus
                  </p>
                </div>
              )}
            </div>
            
            {/* Collapse toggle button - only on desktop */}
            {!isMobile && onToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className={cn(
                  "absolute -right-3 top-8 h-6 w-6 rounded-full border bg-sidebar shadow-md hover:bg-sidebar-accent transition-all duration-200",
                  isCollapsed ? "rotate-180" : ""
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex flex-1 flex-col transition-all duration-300",
            isCollapsed && !isMobile ? "px-2" : "px-6"
          )}>
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              <li>
                <ul role="list" className="space-y-2">
                  {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-4 rounded-xl p-3 text-sm font-semibold transition-all duration-200 relative overflow-hidden",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                              : "text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
                            isCollapsed && !isMobile ? "justify-center px-2" : ""
                          )}
                          title={isCollapsed && !isMobile ? item.name : undefined}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary to-chart-2 opacity-100"></div>
                          )}
                          
                          {/* Content */}
                          <div className={cn(
                            "relative z-10 flex items-center w-full transition-all duration-200",
                            isCollapsed && !isMobile ? "justify-center" : "gap-x-4"
                          )}>
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                              isActive
                                ? "bg-sidebar-primary-foreground/20"
                                : "bg-sidebar-accent/30 group-hover:bg-sidebar-primary/20"
                            )}>
                              <item.icon
                                className={cn(
                                  "h-5 w-5 transition-all duration-200",
                                  isActive
                                    ? "text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground group-hover:text-sidebar-primary"
                                )}
                                aria-hidden="true"
                              />
                            </div>
                            {(!isCollapsed || isMobile) && (
                              <span className="flex-1">{item.name}</span>
                            )}
                          </div>
                          
                          {/* Hover effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 to-chart-2/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Footer with user info or branding */}
          <div className={cn(
            "border-t border-sidebar-border pt-4 transition-all duration-300",
            isCollapsed && !isMobile ? "px-2" : "px-6"
          )}>
            <div className={cn(
              "transition-all duration-300",
              isCollapsed && !isMobile ? "text-center" : "text-center"
            )}>
              {(!isCollapsed || isMobile) && (
                <p className="text-xs text-sidebar-foreground/60">
                  Game Development Platform
                </p>
              )}
              <div className="mt-2 flex justify-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-sidebar-primary/40"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}