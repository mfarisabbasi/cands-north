"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import useAuthStore from "@/lib/store/useAuthStore";

function StaffContent() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || "Failed to fetch users");
        if (response.status === 401) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error("An error occurred while fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  const canManageUser = (targetAccountType) => {
    if (!currentUser) return false;

    const { accountType } = currentUser;

    // Admin can only view
    if (accountType === "Admin") return false;

    // Only Owner can manage Owner accounts
    if (targetAccountType === "Owner" && accountType !== "Owner") {
      return false;
    }

    // Owner, Closer, and Management can manage other types
    return ["Owner", "Closer", "Management"].includes(accountType);
  };

  const canAddOwner = () => {
    return currentUser?.accountType === "Owner";
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Account deleted successfully");
        fetchUsers();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Staff Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {currentUser?.username} ({currentUser?.accountType})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => router.push("/staff/add")}
              variant="default"
              className="flex-1 sm:flex-none"
              disabled={currentUser?.accountType === "Admin"}
            >
              Add Staff
            </Button>
          </div>
        </div>

        {/* Staff Table Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>All Staff Accounts</CardTitle>
            <CardDescription>
              Manage and view all staff members in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Username</TableHead>
                      <TableHead className="font-semibold">
                        Account Type
                      </TableHead>
                      <TableHead className="font-semibold">
                        Created Date
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          No staff accounts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.accountType === "Owner"
                                  ? "bg-primary/10 text-primary"
                                  : user.accountType === "Admin"
                                  ? "bg-accent text-accent-foreground"
                                  : user.accountType === "Management"
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {user.accountType}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canManageUser(user.accountType) ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(`/staff/edit/${user.id}`)
                                    }
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteClick(user)}
                                    disabled={user.id === currentUser?.id}
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  View Only
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for{" "}
              <strong>{userToDelete?.username}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function StaffPage() {
  return (
    <ProtectedLayout>
      <StaffContent />
    </ProtectedLayout>
  );
}
