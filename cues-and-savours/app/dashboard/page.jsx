"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import useAuthStore from "@/lib/store/useAuthStore";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Award,
  Activity,
  Clock,
  Calendar,
  UserCheck,
  Gamepad2,
} from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    todaysSales: { amount: 0, transactions: 0 },
    monthSales: { amount: 0, transactions: 0 },
    activeAdmins: [],
    topGameTypesToday: [],
  });

  // Early redirect for Admin users - don't show any UI
  useEffect(() => {
    if (currentUser && currentUser.accountType === "Admin") {
      router.replace("/tables");
      return;
    }
  }, [currentUser, router]);

  // Don't render anything for Admin users
  if (currentUser && currentUser.accountType === "Admin") {
    return null;
  }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real data for analytics cards
  const statsCards = [
    {
      title: "Today's Sales",
      value: `Rs ${dashboardData.todaysSales.amount.toFixed(2)}`,
      change: `${dashboardData.todaysSales.transactions} transactions`,
      trend: "up",
      icon: DollarSign,
      description: "Sales made today",
    },
    {
      title: "This Month Sales",
      value: `Rs ${dashboardData.monthSales.amount.toFixed(2)}`,
      change: `${dashboardData.monthSales.transactions} transactions`,
      trend: "up",
      icon: Calendar,
      description: "Monthly performance",
    },
    {
      title: "Active Admins",
      value: dashboardData.activeAdmins.length.toString(),
      change:
        dashboardData.activeAdmins.length > 0
          ? "On duty now"
          : "No one on duty",
      trend: dashboardData.activeAdmins.length > 0 ? "up" : "down",
      icon: UserCheck,
      description: "Currently working",
    },
  ];

  // Check if user has access to dashboard (for non-Admin users)
  useEffect(() => {
    if (currentUser && !isLoading) {
      const allowedAccountTypes = ["Management", "Owner", "Closer"];
      if (!allowedAccountTypes.includes(currentUser.accountType)) {
        router.replace("/tables"); // Use replace instead of push to avoid back navigation
      }
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have permission
  if (
    currentUser &&
    !["Management", "Owner", "Closer"].includes(currentUser.accountType)
  ) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the dashboard.
            </p>
            <p className="text-sm text-muted-foreground">
              Only Management, Owners, and Closers can view the dashboard.
            </p>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {currentUser?.username} ({currentUser?.accountType})
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-border shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`text-xs font-medium ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stat.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Active Admins */}
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Active Admins
              </CardTitle>
              <CardDescription>
                Staff members currently on shift
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.activeAdmins.length > 0 ? (
                  dashboardData.activeAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-green-50 dark:bg-green-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="font-medium">{admin.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {admin.accountType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Since{" "}
                          {new Date(admin.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No admin currently on shift</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Game Types Today */}
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Top Game Types Today
              </CardTitle>
              <CardDescription>
                Most active game types by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.topGameTypesToday.length > 0 ? (
                  dashboardData.topGameTypesToday.map((gameType, index) => (
                    <div key={gameType._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{gameType.gameTypeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {gameType.totalSessions} sessions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            Rs {gameType.totalSales.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (gameType.totalSales /
                                Math.max(
                                  ...dashboardData.topGameTypesToday.map(
                                    (g) => g.totalSales
                                  )
                                )) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No game type data for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardContent />
    </ProtectedLayout>
  );
}
