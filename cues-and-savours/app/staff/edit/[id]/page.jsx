"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

function EditStaffContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [formData, setFormData] = useState({
    username: "",
    accountType: "",
    password: "",
    confirmPassword: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch all users to get current user and target user info
      const response = await fetch("/api/users");
      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.currentUser);

        // Find the target user
        const user = data.users.find((u) => u.id === userId);
        if (user) {
          setTargetUser(user);
          setFormData({
            username: user.username,
            accountType: user.accountType,
            password: "",
            confirmPassword: "",
          });
        } else {
          toast.error("User not found");
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      toast.error("Failed to load user data");
      router.push("/dashboard");
    } finally {
      setIsFetching(false);
    }
  };

  const canManageUser = () => {
    if (!currentUser || !targetUser) return false;

    const { accountType } = currentUser;

    // Admin can only view
    if (accountType === "Admin") return false;

    // Only Owner can manage Owner accounts
    if (targetUser.accountType === "Owner" && accountType !== "Owner") {
      return false;
    }

    // Owner, Closer, and Management can manage other types
    return ["Owner", "Closer", "Management"].includes(accountType);
  };

  const getAvailableAccountTypes = () => {
    const allTypes = ["Owner", "Closer", "Management", "Admin"];

    if (currentUser?.accountType === "Owner") {
      return allTypes; // Owner can set all types
    }

    // Others cannot set Owner type
    return allTypes.filter((type) => type !== "Owner");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check permissions
    if (!canManageUser()) {
      toast.error("You don't have permission to edit this account");
      return;
    }

    // Validation
    if (!formData.username || !formData.accountType) {
      toast.error("Username and account type are required");
      return;
    }

    // Password validation (only if password is being changed)
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
    }

    setIsLoading(true);

    try {
      const updateData = {
        username: formData.username,
        accountType: formData.accountType,
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Account updated successfully!");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Failed to update account");
      }
    } catch (error) {
      console.error("Update account error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!canManageUser()) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to edit this account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold text-foreground">
            Edit Staff Account
          </h1>
          <p className="text-muted-foreground mt-1">
            Update account information for {targetUser?.username}
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Update the information below. Leave password fields empty to keep
              the current password.
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
                    Only Owners can set Owner account type
                  </p>
                )}
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3">
                  Change Password (Optional)
                </h3>

                {/* New Password */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Leave empty to keep current password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                      Updating Account...
                    </span>
                  ) : (
                    "Update Account"
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

export default function EditStaffPage() {
  return (
    <ProtectedLayout>
      <EditStaffContent />
    </ProtectedLayout>
  );
}
