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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/ProtectedLayout";

function GameTypesContent() {
  const router = useRouter();
  const [gameTypes, setGameTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameTypeToDelete, setGameTypeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGameType, setEditingGameType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    chargeType: "Per Minute",
    chargeAmount: "",
    includedControllers: "0",
    includedPlayers: "0",
    additionalPersonCharge: "0",
    additionalControllerCharge: "0",
    // Flexible pricing fields
    halfHourRate: "",
    hourRate: "",
    thresholdMinutes: "40",
  });

  useEffect(() => {
    fetchGameTypes();
  }, []);

  const fetchGameTypes = async () => {
    try {
      const response = await fetch("/api/gametypes");
      const data = await response.json();

      if (data.success) {
        setGameTypes(data.gameTypes);
      } else {
        toast.error(data.message || "Failed to fetch game types");
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Fetch game types error:", error);
      toast.error("An error occurred while fetching game types");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (gameType) => {
    setGameTypeToDelete(gameType);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameTypeToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/gametypes/${gameTypeToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Game type deleted successfully");
        fetchGameTypes();
        setDeleteDialogOpen(false);
        setGameTypeToDelete(null);
      } else {
        toast.error(data.message || "Failed to delete game type");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    setEditingGameType(null);
    setFormData({
      name: "",
      chargeType: "Per Minute",
      chargeAmount: "",
      includedControllers: "0",
      includedPlayers: "0",
      additionalPersonCharge: "0",
      additionalControllerCharge: "0",
      halfHourRate: "",
      hourRate: "",
      thresholdMinutes: "40",
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (gameType) => {
    setEditingGameType(gameType);
    setFormData({
      name: gameType.name,
      chargeType: gameType.chargeType,
      chargeAmount: gameType.chargeAmount?.toString() || "",
      includedControllers: gameType.includedControllers.toString(),
      includedPlayers: gameType.includedPlayers.toString(),
      additionalPersonCharge: gameType.additionalPersonCharge.toString(),
      additionalControllerCharge:
        gameType.additionalControllerCharge.toString(),
      halfHourRate: gameType.flexiblePricing?.halfHourRate?.toString() || "",
      hourRate: gameType.flexiblePricing?.hourRate?.toString() || "",
      thresholdMinutes:
        gameType.flexiblePricing?.thresholdMinutes?.toString() || "40",
    });
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validation based on charge type
    if (!formData.name) {
      toast.error("Game name is required");
      return;
    }

    if (formData.chargeType === "Flexible") {
      if (!formData.halfHourRate || !formData.hourRate) {
        toast.error(
          "Half hour rate and hour rate are required for flexible pricing"
        );
        return;
      }
    } else {
      if (!formData.chargeAmount) {
        toast.error("Charge amount is required");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        chargeType: formData.chargeType,
        includedControllers: parseInt(formData.includedControllers) || 0,
        includedPlayers: parseInt(formData.includedPlayers) || 0,
        additionalPersonCharge:
          parseFloat(formData.additionalPersonCharge) || 0,
        additionalControllerCharge:
          parseFloat(formData.additionalControllerCharge) || 0,
      };

      // Add charge amount for non-flexible types
      if (formData.chargeType !== "Flexible") {
        payload.chargeAmount = parseFloat(formData.chargeAmount);
      } else {
        // Add flexible pricing data
        payload.flexiblePricing = {
          halfHourRate: parseFloat(formData.halfHourRate),
          hourRate: parseFloat(formData.hourRate),
          thresholdMinutes: parseInt(formData.thresholdMinutes) || 40,
        };
      }

      const url = editingGameType
        ? `/api/gametypes/${editingGameType.id}`
        : "/api/gametypes";
      const method = editingGameType ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingGameType
            ? "Game type updated successfully"
            : "Game type created successfully"
        );
        fetchGameTypes();
        setFormDialogOpen(false);
      } else {
        toast.error(data.message || "Failed to save game type");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
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
              Game Types Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage game types and their charges
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button onClick={handleAddNew} className="flex-1 sm:flex-none">
              Add New Game Type
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Game Types Table Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>All Game Types</CardTitle>
            <CardDescription>
              View and manage all available game types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Game Name</TableHead>
                      <TableHead className="font-semibold">
                        Charge Type
                      </TableHead>
                      <TableHead className="font-semibold">
                        Charge Amount
                      </TableHead>
                      <TableHead className="font-semibold">
                        Additional Charges
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameTypes.length === 0 ? (
                      <TableRow key="empty-state">
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No game types found. Click "Add New Game Type" to
                          create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      gameTypes.map((gameType) => (
                        <TableRow
                          key={gameType._id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {gameType.name}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {gameType.chargeType}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            Rs {gameType.chargeAmount}
                          </TableCell>
                          <TableCell className="text-sm">
                            {gameType.additionalPersonCharge > 0 ||
                            gameType.additionalControllerCharge > 0 ? (
                              <div className="space-y-1">
                                {gameType.additionalPersonCharge > 0 && (
                                  <div>
                                    Rs {gameType.additionalPersonCharge}/person
                                  </div>
                                )}
                                {gameType.additionalControllerCharge > 0 && (
                                  <div>
                                    Rs {gameType.additionalControllerCharge}
                                    /controller
                                  </div>
                                )}
                                {gameType.includedPlayers > 0 && (
                                  <div className="text-muted-foreground text-xs">
                                    Includes {gameType.includedPlayers} players
                                  </div>
                                )}
                                {gameType.includedControllers > 0 && (
                                  <div className="text-muted-foreground text-xs">
                                    Includes {gameType.includedControllers}{" "}
                                    controllers
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                None
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(gameType)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClick(gameType)}
                              >
                                Delete
                              </Button>
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
              This will permanently delete the game type{" "}
              <strong>{gameTypeToDelete?.name}</strong>. This action cannot be
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

      {/* Add/Edit Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGameType ? "Edit Game Type" : "Add New Game Type"}
            </DialogTitle>
            <DialogDescription>
              {editingGameType
                ? "Update the game type information below"
                : "Fill in the information to create a new game type"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Game Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Snooker, Pool, Playstation 5"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Charge Type */}
              <div className="space-y-2">
                <Label htmlFor="chargeType">
                  Charge Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.chargeType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, chargeType: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per Minute">Per Minute</SelectItem>
                    <SelectItem value="Per Half Hour">Per Half Hour</SelectItem>
                    <SelectItem value="Per Hour">Per Hour</SelectItem>
                    <SelectItem value="Flexible">
                      Flexible (Table Tennis)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Charge Amount - Only for non-flexible types */}
              {formData.chargeType !== "Flexible" && (
                <div className="space-y-2">
                  <Label htmlFor="chargeAmount">
                    Charge Amount (Rs){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="chargeAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.chargeAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, chargeAmount: e.target.value })
                    }
                    placeholder="0"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}
            </div>

            {/* Flexible Pricing Section */}
            {formData.chargeType === "Flexible" && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium mb-3">
                  Flexible Pricing Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="halfHourRate">
                      Half Hour Rate (Rs){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="halfHourRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.halfHourRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          halfHourRate: e.target.value,
                        })
                      }
                      placeholder="400"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourRate">
                      Hour Rate (Rs) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="hourRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourRate: e.target.value })
                      }
                      placeholder="600"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thresholdMinutes">
                      Threshold (Minutes)
                    </Label>
                    <Input
                      id="thresholdMinutes"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.thresholdMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thresholdMinutes: e.target.value,
                        })
                      }
                      placeholder="40"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      If session ≤ {formData.thresholdMinutes || 40} minutes,
                      charge half hour rate. Otherwise, charge hour rate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3">
                Optional: PlayStation Lounge Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Included Controllers */}
                <div className="space-y-2">
                  <Label htmlFor="includedControllers">
                    Included Controllers
                  </Label>
                  <Input
                    id="includedControllers"
                    type="number"
                    min="0"
                    value={formData.includedControllers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        includedControllers: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                {/* Included Players */}
                <div className="space-y-2">
                  <Label htmlFor="includedPlayers">Included Players</Label>
                  <Input
                    id="includedPlayers"
                    type="number"
                    min="0"
                    value={formData.includedPlayers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        includedPlayers: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3">Additional Charges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Additional Person Charge */}
                <div className="space-y-2">
                  <Label htmlFor="additionalPersonCharge">
                    Per Additional Person (Rs)
                  </Label>
                  <Input
                    id="additionalPersonCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.additionalPersonCharge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additionalPersonCharge: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                {/* Additional Controller Charge */}
                <div className="space-y-2">
                  <Label htmlFor="additionalControllerCharge">
                    Per Additional Controller (Rs)
                  </Label>
                  <Input
                    id="additionalControllerCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.additionalControllerCharge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additionalControllerCharge: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    {editingGameType ? "Updating..." : "Creating..."}
                  </span>
                ) : editingGameType ? (
                  "Update Game Type"
                ) : (
                  "Create Game Type"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setFormDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GameTypesPage() {
  return (
    <ProtectedLayout>
      <GameTypesContent />
    </ProtectedLayout>
  );
}
