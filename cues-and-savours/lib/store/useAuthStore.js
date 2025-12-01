import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: true,
      activeShift: null, // Current active shift for admin
      shiftLoading: false, // Loading state for shift operations

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          activeShift: null,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setActiveShift: (shift) => set({ activeShift: shift }),
      clearActiveShift: () => set({ activeShift: null }),

      checkActiveShift: async () => {
        try {
          const response = await fetch("/api/shifts/current");
          const data = await response.json();
          if (data.success) {
            get().setActiveShift(data.hasActiveShift ? data.shift : null);
          }
        } catch (error) {
          console.error("Failed to check active shift:", error);
          get().clearActiveShift();
        }
      },

      startShift: async () => {
        set({ shiftLoading: true });
        try {
          const response = await fetch("/api/shifts/start", {
            method: "POST",
          });
          const data = await response.json();
          if (data.success) {
            get().setActiveShift(data.shift);
            return { success: true, message: data.message };
          } else {
            return { success: false, message: data.message };
          }
        } catch (error) {
          console.error("Start shift error:", error);
          return { success: false, message: "Failed to start shift" };
        } finally {
          set({ shiftLoading: false });
        }
      },

      endShift: async () => {
        set({ shiftLoading: true });
        try {
          const response = await fetch("/api/shifts/end", {
            method: "POST",
          });
          const data = await response.json();
          if (data.success) {
            get().clearActiveShift();
            return { success: true, message: data.message };
          } else {
            return { success: false, message: data.message };
          }
        } catch (error) {
          console.error("End shift error:", error);
          return { success: false, message: "Failed to end shift" };
        } finally {
          set({ shiftLoading: false });
        }
      },

      // Fetch current user from API (uses cookie automatically)
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/me");
          const data = await response.json();

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            // If user is admin, check for active shift
            if (data.user.accountType === "Admin") {
              get().checkActiveShift();
            }
            return data.user;
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return null;
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return null;
        }
      },

      // Login action
      login: async (username, password) => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true, user: data.user };
          } else {
            return { success: false, message: data.message };
          }
        } catch (error) {
          console.error("Login error:", error);
          return { success: false, message: "Failed to login" };
        }
      },

      // Logout action
      logout: async () => {
        try {
          // If admin has active shift, end it first
          const { user, activeShift } = get();
          if (user?.accountType === "Admin" && activeShift) {
            await get().endShift();
          }

          const response = await fetch("/api/auth/logout", {
            method: "POST",
          });

          // Get remaining balance from response if admin
          if (user?.accountType === "Admin" && response.ok) {
            const data = await response.json();
            if (data.remainingBalance && data.remainingBalance > 0) {
              localStorage.setItem(
                "remainingBalance",
                data.remainingBalance.toString()
              );
            }
          }

          localStorage.removeItem("user");

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            activeShift: null,
          });

          // Redirect to login
          window.location.href = "/login";
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        // Only persist user and isAuthenticated
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
