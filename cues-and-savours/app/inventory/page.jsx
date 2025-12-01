"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Package,
  Search,
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";

function InventoryContent() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStockAdjustDialogOpen, setIsStockAdjustDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    isStockManaged: true,
    currentStock: 0,
    lowStockThreshold: 10,
    unit: "pcs",
  });
  const [stockAdjustData, setStockAdjustData] = useState({
    type: "stock_in",
    quantity: "",
    reason: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
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
        const isAuthorized = ["Owner", "Management"].includes(
          data.currentUser.accountType
        );
        if (!isAuthorized) {
          toast.error(
            "You don't have permission to access inventory management"
          );
          router.push("/dashboard");
          return;
        }
        fetchInventory();
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

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setInventory(data.items);
      setFilteredItems(data.items);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load inventory items");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = inventory.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(inventory);
    }
  }, [searchTerm, inventory]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add item");

      toast.success("Item added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        price: "",
        isStockManaged: true,
        currentStock: 0,
        lowStockThreshold: 10,
        unit: "pcs",
      });
      fetchInventory();
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/inventory/${currentItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update item");

      toast.success("Item updated successfully");
      setIsEditDialogOpen(false);
      setCurrentItem(null);
      fetchInventory();
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/inventory/${currentItem._id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      toast.success("Item deleted successfully");
      setIsDeleteDialogOpen(false);
      setCurrentItem(null);
      fetchInventory();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const openEditDialog = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      isStockManaged: item.isStockManaged ?? true,
      currentStock: item.currentStock ?? 0,
      lowStockThreshold: item.lowStockThreshold ?? 10,
      unit: item.unit || "pcs",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const openStockAdjustDialog = (item) => {
    setCurrentItem(item);
    setStockAdjustData({
      type: "stock_in",
      quantity: "",
      reason: "",
    });
    setIsStockAdjustDialogOpen(true);
  };

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/inventory/${currentItem._id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockAdjustData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      toast.success("Stock adjusted successfully");
      setIsStockAdjustDialogOpen(false);
      setCurrentItem(null);
      setStockAdjustData({
        type: "stock_in",
        quantity: "",
        reason: "",
      });
      fetchInventory();
    } catch (error) {
      toast.error(error.message || "Failed to adjust stock");
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
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
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory items and their prices
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <CardTitle>Inventory Items</CardTitle>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Price (PKR)</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isStockManaged = item.isStockManaged ?? true;
                    const currentStock = item.currentStock ?? 0;
                    const threshold = item.lowStockThreshold ?? 10;
                    const isLowStock =
                      isStockManaged &&
                      currentStock <= threshold &&
                      currentStock > 0;
                    const isOutOfStock = isStockManaged && currentStock === 0;

                    return (
                      <TableRow key={item._id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>Rs {item.price.toLocaleString()}</TableCell>
                        <TableCell>
                          {!isStockManaged ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              Not Tracked
                            </span>
                          ) : isOutOfStock ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                              In Stock
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isStockManaged
                            ? `${currentStock} ${item.unit || "pcs"}`
                            : "-"}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {isStockManaged && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openStockAdjustDialog(item)}
                              title="Adjust Stock"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Add Item Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="Enter price in PKR"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isStockManaged"
                        checked={formData.isStockManaged}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isStockManaged: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor="isStockManaged"
                        className="cursor-pointer"
                      >
                        Track Stock for this item
                      </Label>
                    </div>
                  </div>

                  {formData.isStockManaged && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="currentStock">Current Stock</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.currentStock}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              currentStock: e.target.value,
                            }))
                          }
                          placeholder="Enter current stock"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              unit: e.target.value,
                            }))
                          }
                          placeholder="e.g., pcs, kg, liters"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lowStockThreshold">
                          Low Stock Alert Threshold
                        </Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.lowStockThreshold}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lowStockThreshold: e.target.value,
                            }))
                          }
                          placeholder="Alert when stock falls below this number"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Item</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Item Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Item Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (PKR)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="Enter price in PKR"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-isStockManaged"
                        checked={formData.isStockManaged}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isStockManaged: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor="edit-isStockManaged"
                        className="cursor-pointer"
                      >
                        Track Stock for this item
                      </Label>
                    </div>
                  </div>

                  {formData.isStockManaged && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit-currentStock">Current Stock</Label>
                        <Input
                          id="edit-currentStock"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.currentStock}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              currentStock: e.target.value,
                            }))
                          }
                          placeholder="Enter current stock"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-unit">Unit</Label>
                        <Input
                          id="edit-unit"
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              unit: e.target.value,
                            }))
                          }
                          placeholder="e.g., pcs, kg, liters"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lowStockThreshold">
                          Low Stock Alert Threshold
                        </Label>
                        <Input
                          id="edit-lowStockThreshold"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.lowStockThreshold}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lowStockThreshold: e.target.value,
                            }))
                          }
                          placeholder="Alert when stock falls below this number"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Item</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the item "{currentItem?.name}".
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Stock Adjustment Dialog */}
            <Dialog
              open={isStockAdjustDialogOpen}
              onOpenChange={setIsStockAdjustDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adjust Stock - {currentItem?.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleStockAdjust} className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Current Stock
                    </p>
                    <p className="text-2xl font-bold">
                      {currentItem?.currentStock || 0}{" "}
                      {currentItem?.unit || "pcs"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock-type">Action</Label>
                    <Select
                      value={stockAdjustData.type}
                      onValueChange={(value) =>
                        setStockAdjustData((prev) => ({
                          ...prev,
                          type: value,
                        }))
                      }
                    >
                      <SelectTrigger id="stock-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock_in">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span>Add Stock (Stock In)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="stock_out">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span>Remove Stock (Stock Out)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="adjustment">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                            <span>Set Exact Stock (Adjustment)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock-quantity">
                      {stockAdjustData.type === "adjustment"
                        ? "New Stock Amount"
                        : "Quantity"}
                    </Label>
                    <Input
                      id="stock-quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={stockAdjustData.quantity}
                      onChange={(e) =>
                        setStockAdjustData((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      placeholder={
                        stockAdjustData.type === "adjustment"
                          ? "Enter new total stock"
                          : "Enter quantity"
                      }
                      required
                    />
                    {stockAdjustData.type === "adjustment" &&
                      stockAdjustData.quantity && (
                        <p className="text-xs text-muted-foreground">
                          Change:{" "}
                          {parseInt(stockAdjustData.quantity) -
                            (currentItem?.currentStock || 0) >
                          0
                            ? "+"
                            : ""}
                          {parseInt(stockAdjustData.quantity) -
                            (currentItem?.currentStock || 0)}{" "}
                          {currentItem?.unit || "pcs"}
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock-reason">Reason</Label>
                    <Input
                      id="stock-reason"
                      value={stockAdjustData.reason}
                      onChange={(e) =>
                        setStockAdjustData((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="e.g., New delivery, Damaged items, Stock count correction"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsStockAdjustDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Adjust Stock</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedLayout>
      <InventoryContent />
    </ProtectedLayout>
  );
}
