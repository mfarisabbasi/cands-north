"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import useAuthStore from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Filter,
  TrendingUp,
  Users,
  Gamepad2,
  RefreshCw,
} from "lucide-react";

function SalesDataContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  });

  // Filter states
  const [filterType, setFilterType] = useState("all"); // all, admin, gameType
  const [dateRange, setDateRange] = useState("currentMonth"); // currentMonth, lastMonth, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedGameType, setSelectedGameType] = useState("");

  // Data for dropdowns
  const [admins, setAdmins] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);

  useEffect(() => {
    fetchAdmins();
    fetchGameTypes();
    fetchSalesData();
  }, []);

  // Check if user has access to sales data
  useEffect(() => {
    if (user && !loading) {
      const allowedAccountTypes = ["Management", "Owner", "Closer"];
      if (!allowedAccountTypes.includes(user.accountType)) {
        router.push("/tables"); // Redirect to tables page if not authorized
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchSalesData();
  }, [
    filterType,
    dateRange,
    customStartDate,
    customEndDate,
    selectedAdmin,
    selectedGameType,
  ]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Show only Admin account types
        const allUsers = data.users || [];
        const adminUsers = allUsers.filter(
          (user) => user.accountType === "Admin"
        );
        // Map the id field to _id for compatibility with select component
        const mappedUsers = adminUsers.map((user) => ({
          ...user,
          _id: user.id,
        }));
        setAdmins(mappedUsers);
        console.log("Fetched admins:", mappedUsers); // Debug log
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchGameTypes = async () => {
    try {
      const response = await fetch("/api/gametypes");
      if (response.ok) {
        const data = await response.json();
        setGameTypes(data.gameTypes || []);
      }
    } catch (error) {
      console.error("Error fetching game types:", error);
    }
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add date range parameters
      if (dateRange === "custom" && customStartDate && customEndDate) {
        params.append("startDate", customStartDate);
        params.append("endDate", customEndDate);
      } else {
        params.append("dateRange", dateRange);
      }

      // Add filter parameters
      if (filterType === "admin" && selectedAdmin) {
        params.append("adminId", selectedAdmin);
      } else if (filterType === "gameType" && selectedGameType) {
        params.append("gameTypeId", selectedGameType);
      }

      const response = await fetch(`/api/sales-data?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSalesData(data.salesData || []);
        setSummaryStats(data.summary || {});
      } else {
        toast.error("Failed to fetch sales data");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast.error("Error loading sales data");
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case "currentMonth":
        return "Current Month";
      case "lastMonth":
        return "Last Month";
      case "custom":
        return customStartDate && customEndDate
          ? `${customStartDate} to ${customEndDate}`
          : "Custom Range";
      default:
        return "All Time";
    }
  };

  const getFilterText = () => {
    switch (filterType) {
      case "admin":
        const admin = admins.find((a) => a._id === selectedAdmin);
        return admin ? `Admin: ${admin.username}` : "Select Admin";
      case "gameType":
        const gameType = gameTypes.find((g) => g._id === selectedGameType);
        return gameType ? `Game Type: ${gameType.name}` : "Select Game Type";
      default:
        return "All Data";
    }
  };

  const handleFilterTypeChange = (newFilterType) => {
    setFilterType(newFilterType);
    // Clear previous selections when changing filter type
    if (newFilterType !== "admin") {
      setSelectedAdmin("");
    }
    if (newFilterType !== "gameType") {
      setSelectedGameType("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have permission
  if (user && !["Management", "Owner", "Closer"].includes(user.accountType)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access sales data.
            </p>
            <p className="text-sm text-muted-foreground">
              Only Management, Owners, and Closers can view sales analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Sales Data
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive sales analytics and reporting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchSalesData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter sales data by date range, admin, or game type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="currentMonth">Current Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Type */}
              <div className="space-y-2">
                <Label>Filter By</Label>
                <Select
                  value={filterType}
                  onValueChange={handleFilterTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gameType">Game Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Filter */}
              {filterType === "admin" && (
                <div className="space-y-2">
                  <Label>Select Admin</Label>
                  <Select
                    value={selectedAdmin}
                    onValueChange={setSelectedAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {admins
                        .filter((admin) => admin && admin._id && admin.username)
                        .map((admin) => (
                          <SelectItem key={admin._id} value={admin._id}>
                            {admin.username} ({admin.accountType})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Game Type Filter */}
              {filterType === "gameType" && (
                <div className="space-y-2">
                  <Label>Select Game Type</Label>
                  <Select
                    value={selectedGameType}
                    onValueChange={setSelectedGameType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose game type" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameTypes.map((gameType) => (
                        <SelectItem key={gameType._id} value={gameType._id}>
                          {gameType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Custom Date Range */}
            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rs {summaryStats.totalSales?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                {getDateRangeText()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.totalTransactions || 0}
              </div>
              <p className="text-xs text-muted-foreground">{getFilterText()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Transaction
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rs {summaryStats.averageTransaction?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Transactions</CardTitle>
            <CardDescription>
              Detailed view of all sales transactions {getFilterText()} -{" "}
              {getDateRangeText()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Game Type</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {transaction.createdBy?.username || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.createdBy?.accountType}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.customData?.gameType ||
                            transaction.table?.gameType?.name ||
                            "N/A"}
                        </TableCell>
                        <TableCell>
                          {transaction.table?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {transaction.customer?.name || "Walk-in"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.customData ? "default" : "secondary"
                            }
                          >
                            {transaction.customData
                              ? "Table Billing"
                              : "Inventory Sale"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rs {transaction.total?.toFixed(2) || "0.00"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No sales data found
                </h3>
                <p className="text-sm">
                  Try adjusting your filters or date range to see sales data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SalesDataPage() {
  return (
    <ProtectedLayout>
      <SalesDataContent />
    </ProtectedLayout>
  );
}
