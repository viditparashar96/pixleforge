"use client";

import { Button } from "@/components/ui/button";
import { ThemeSettingsPanel } from "@/components/ui/theme-settings-panel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowRight, FolderOpen, Lock, Shield, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden">
      {/* Theme Controls - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 glass p-2 rounded-xl border border-border/50">
        <ThemeToggle />
        <ThemeSettingsPanel />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full animate-float opacity-20"
          style={{ background: "var(--gradient-primary)" }}
        ></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full animate-float opacity-20"
          style={{
            background: "var(--gradient-secondary)",
            animationDelay: "1s",
          }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full animate-float opacity-10"
          style={{ background: "var(--gradient-accent)", animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          <div className="text-center space-y-8 animate-scale-in">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="relative">
                <Shield className="h-16 w-16 text-primary animate-glow" />
                <div className="absolute inset-0 h-16 w-16 animate-pulse">
                  <Shield className="h-16 w-16 text-primary opacity-50" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                  PixelForge
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-neon mt-2">
                  Nexus
                </h2>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The{" "}
              {/* <span className="font-semibold gradient-primary bg-clip-text text-transparent"> */}
              ultimate game development
              {/* </span>{" "} */}
              project management system. Streamline your workflow with
              cutting-edge collaboration tools, role-based security, and
              real-time project tracking.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
              <div className="text-center space-y-6 card-glow bg-card/50 backdrop-blur-sm p-8 rounded-2xl feature-highlight">
                <div className="mx-auto h-16 w-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Team Collaboration
                </h3>
                <p className="text-muted-foreground">
                  Organize your dev teams with advanced role management,
                  real-time communication, and seamless project assignments.
                </p>
              </div>

              <div className="text-center space-y-6 card-glow bg-card/50 backdrop-blur-sm p-8 rounded-2xl feature-highlight">
                <div className="mx-auto h-16 w-16 gradient-secondary rounded-2xl flex items-center justify-center shadow-lg">
                  <FolderOpen className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Smart Project Tracking
                </h3>
                <p className="text-muted-foreground">
                  Monitor milestones, track deliverables, and visualize progress
                  with intuitive dashboards and automated reporting.
                </p>
              </div>

              <div className="text-center space-y-6 card-glow bg-card/50 backdrop-blur-sm p-8 rounded-2xl feature-highlight">
                <div className="mx-auto h-16 w-16 gradient-accent rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Enterprise Security
                </h3>
                <p className="text-muted-foreground">
                  Bank-level encryption, multi-factor authentication, and
                  granular access controls to protect your IP.
                </p>
              </div>
            </div>

            <div className="pt-12 space-y-4">
              <Button
                asChild
                size="lg"
                className="btn-primary-glow text-lg px-8 py-4 rounded-xl font-semibold border-0"
              >
                <Link href="/auth/signin">
                  Launch Your Game Dev Journey
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Join thousands of game developers worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
