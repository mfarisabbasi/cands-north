"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import useAuthStore from "@/lib/store/useAuthStore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

function ShiftsContent() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalShifts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters
  const [filters, setFilters] = useState({
    adminName: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const fetchShifts = async (page = 1, filterParams = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...filterParams,
      });

      const response = await fetch(`/api/shifts?${params}`);
      const data = await response.json();

      if (data.success) {
        setShifts(data.shifts);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch shifts:", data.message);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(currentPage, filters);
  }, [currentPage, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchShifts(1, filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      adminName: "",
      startDate: "",
      endDate: "",
      status: "",
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return dayjs(dateString)
      .tz("Asia/Karachi")
      .format("DD-MM-YYYY | hh:mm A (PST)");
  };

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/20">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Ended</Badge>
    );
  };

  const canViewShifts = ["Owner", "Closer", "Management"].includes(
    user?.accountType
  );

  if (!canViewShifts) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                  <p className="text-muted-foreground">
                    Only Owner, Closer, and Management can view shift data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Shift Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor admin shifts and working hours
              </p>
            </div>
            <Button
              onClick={() => fetchShifts(currentPage, filters)}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
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
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminName"
                    placeholder="Search admin..."
                    value={filters.adminName}
                    onChange={(e) =>
                      handleFilterChange("adminName", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  Search
                </Button>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {shifts.length} of {pagination.totalShifts} shifts
          </p>
        </div>

        {/* Shifts Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading shifts...</p>
                </div>
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shifts found</h3>
                <p className="text-muted-foreground">
                  No shift records match your current filters.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {shift.admin.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {shift.admin.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(shift.startTime)}</TableCell>
                      <TableCell>{formatDateTime(shift.endTime)}</TableCell>
                      <TableCell>{shift.formattedDuration || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(shift.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShiftsPage() {
  return (
    <ProtectedLayout>
      <ShiftsContent />
    </ProtectedLayout>
  );
}
