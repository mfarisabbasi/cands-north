"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/lib/store/useAuthStore";
import { AppSidebar } from "./AppSidebar";
import { ShiftStartModal } from "./ShiftStartModal";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function ProtectedLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser, user, activeShift } =
    useAuthStore();
  const [showShiftModal, setShowShiftModal] = useState(false);

  useEffect(() => {
    // Fetch user on mount to verify cookie-based auth
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check if admin needs to start shift
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.accountType === "Admin" &&
      !activeShift
    ) {
      setShowShiftModal(true);
    } else {
      setShowShiftModal(false);
    }
  }, [isLoading, isAuthenticated, user, activeShift]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SidebarProvider>
        <div
          className={`flex h-screen w-full overflow-hidden bg-background ${
            showShiftModal ? "blur-sm pointer-events-none" : ""
          }`}
        >
          {/* Sidebar */}
          <AppSidebar />

          {/* Main Content */}
          <SidebarInset className="flex-1 overflow-y-auto">
            <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1" />
            </header>
            <div className="flex-1 p-4 lg:p-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Shift Start Modal */}
      <ShiftStartModal
        isOpen={showShiftModal}
        onClose={() => {}} // Prevent closing the modal
      />
    </>
  );
}
