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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/ProtectedLayout";

function AddStaffContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    accountType: "",
    password: "",
    confirmPassword: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.currentUser);

        // Check if user can add accounts
        if (data.currentUser.accountType === "Admin") {
          toast.error("You don't have permission to add accounts");
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAccountTypeChange = (value) => {
    setFormData({
      ...formData,
      accountType: value,
    });
  };

  const canCreateAccountType = (accountType) => {
    if (!currentUser) return false;

    // Only Owner can create Owner accounts
    if (accountType === "Owner" && currentUser.accountType !== "Owner") {
      return false;
    }

    return true;
  };

  const getAvailableAccountTypes = () => {
    const allTypes = ["Owner", "Closer", "Management", "Admin"];

    if (currentUser?.accountType === "Owner") {
      return allTypes; // Owner can create all types
    }

    // Others can create all except Owner
    return allTypes.filter((type) => type !== "Owner");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.username ||
      !formData.accountType ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!canCreateAccountType(formData.accountType)) {
      toast.error(
        `You don't have permission to create ${formData.accountType} accounts`
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          accountType: formData.accountType,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Staff account created successfully!");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Create account error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Add New Staff</h1>
          <p className="text-muted-foreground mt-1">
            Create a new staff account with appropriate permissions
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Staff Account Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new staff account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Username must be unique and at least 3 characters long
                </p>
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={handleAccountTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableAccountTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentUser?.accountType !== "Owner" && (
                  <p className="text-xs text-muted-foreground">
                    Only Owners can create Owner accounts
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/dashboard")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AddStaffPage() {
  return (
    <ProtectedLayout>
      <AddStaffContent />
    </ProtectedLayout>
  );
}
