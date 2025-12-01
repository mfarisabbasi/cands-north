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
import { Badge } from "@/components/ui/badge";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import useAuthStore from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import { Receipt, Calendar, DollarSign, Filter, RefreshCw } from "lucide-react";

function ExpensesContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filters, setFilters] = useState({
    category: "all",
  });

  // Check permissions
  const canView =
    user?.accountType &&
    ["Owner", "Management", "Admin"].includes(user.accountType);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== "all") {
        params.append("category", filters.category);
      }

      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setExpenses(data.expenses || []);
        setTotalAmount(data.totalAmount || 0);
      } else {
        toast.error(data.error || "Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Error fetching expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchExpenses();
    }
  }, [filters, canView]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/tables")} className="w-full">
              Go to Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryBadgeColor = (category) => {
    const colors = {
      Repair: "bg-red-100 text-red-800",
      Maintenance: "bg-blue-100 text-blue-800",
      "Staff Advance": "bg-green-100 text-green-800",
      Utilities: "bg-yellow-100 text-yellow-800",
      Supplies: "bg-purple-100 text-purple-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track business expenses and advances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-bold text-lg">
                Rs {totalAmount.toFixed(2)}
              </span>
            </div>
          </Card>
          <Button onClick={fetchExpenses} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Staff Advance">Staff Advance</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expenses ({expenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading expenses...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No expenses found</p>
              <p className="text-sm">
                Add your first expense from the Tables page
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getCategoryBadgeColor(expense.category)}
                        variant="secondary"
                      >
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-red-600">
                        Rs {expense.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">
                          {expense.createdBy?.username || "Unknown"}
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          {expense.createdBy?.accountType || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {expense.note || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <ProtectedLayout>
      <ExpensesContent />
    </ProtectedLayout>
  );
}
