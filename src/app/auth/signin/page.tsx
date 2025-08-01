"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SignInSchema, type SignInInput } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Lock, Shield } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const form = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: SignInInput) {
    setIsLoading(true);

    try {
      // First, check if MFA is required for this user
      const mfaCheckResponse = await fetch("/api/auth/check-mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!mfaCheckResponse.ok) {
        toast.error("Invalid email or password");
        return;
      }

      const mfaCheckData = await mfaCheckResponse.json();

      // If MFA is required, redirect to MFA verification page
      if (mfaCheckData.mfaRequired) {
        router.push(
          `/auth/mfa-verify?email=${encodeURIComponent(mfaCheckData.email)}`
        );
        return;
      }

      // If no MFA required, proceed with normal sign in
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Successfully signed in!");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full animate-float opacity-20"
          style={{ background: "var(--gradient-primary)" }}
        ></div>
        <div
          className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full animate-float opacity-20"
          style={{
            background: "var(--gradient-secondary)",
            animationDelay: "1s",
          }}
        ></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="glass p-8 rounded-3xl shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 animate-glow">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your PixelForge Nexus account
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="developer@studio.com"
                          autoComplete="email"
                          className="input-glow h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your secure password"
                          autoComplete="current-password"
                          className="input-glow h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </FormControl>
                      <div className="leading-none">
                        <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                          Keep me signed in for 30 days
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="btn-primary-glow w-full h-12 text-base font-semibold rounded-xl border-0 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Access Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors feature-highlight inline-block px-2 py-1 rounded-lg"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          </Form>
        </div>

        {/* Trust indicators */}
        <div className="text-center mt-6 space-y-3">
          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>SOC 2 Compliant</span>
            </div>
          </div>
          {/* <p className="text-xs text-muted-foreground">
            Your data is protected with enterprise-grade security
          </p> */}
        </div>
      </div>
    </div>
  );
}
