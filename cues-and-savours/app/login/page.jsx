"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import useAuthStore from "@/lib/store/useAuthStore";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.username, formData.password);

      if (result.success) {
        localStorage.setItem("user", JSON.stringify(result.user));
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupAccounts = async () => {
    setIsSettingUp(true);

    try {
      const response = await fetch("/api/auth/setup-accounts", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Default accounts created successfully! You can now login."
        );
      } else {
        toast.error(data.message || "Failed to create accounts");
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("An error occurred while creating accounts.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSeedGameTypes = async () => {
    setIsSeeding(true);

    try {
      const response = await fetch("/api/gametypes/seed", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          data.message || "Default game types seeded successfully!"
        );
      } else {
        toast.error(data.message || "Failed to seed game types");
      }
    } catch (error) {
      console.error("Seed error:", error);
      toast.error("An error occurred while seeding game types.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              <Image
                src="/logo.png"
                alt="Cues & Savours Logo"
                width={200}
                height={200}
                className="mx-auto"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {/* {process.env.NODE_ENV === "development" && (
              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSetupAccounts}
                  disabled={isSettingUp || isLoading || isSeeding}
                >
                  {isSettingUp ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Creating Accounts...
                    </span>
                  ) : (
                    "Setup Default Accounts"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Click to create 4 default accounts (Owner, Management, Closer,
                  Admin)
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSeedGameTypes}
                  disabled={isSeeding || isLoading || isSettingUp}
                >
                  {isSeeding ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Seeding Game Types...
                    </span>
                  ) : (
                    "Seed Default Game Types"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Click to seed 7 default game types (Snooker, Pool, PS5, etc.)
                </p>
              </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
