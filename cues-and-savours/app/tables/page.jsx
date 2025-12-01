"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Square,
  Clock,
  Users,
  UserPlus,
  TableProperties,
  ArrowLeft,
  Gamepad2,
  Store,
  X,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import useAuthStore from "@/lib/store/useAuthStore";
import useRecordedSalesStore from "@/lib/store/useRecordedSalesStore";
import { printReceipt } from "@/lib/utils";

function TablesContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    getSalesForTable,
    getTotalForTable,
    addSaleToTable,
    clearSalesForTable,
    removeItemFromSale,
    updateItemQuantityInSale,
    removeSaleFromTable,
  } = useRecordedSalesStore();

  const [tables, setTables] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [isRecordPersonSaleOpen, setIsRecordPersonSaleOpen] = useState(false);
  const [isAddPersonDialogOpen, setIsAddPersonDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isPendingSaleDialogOpen, setIsPendingSaleDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const [currentTable, setCurrentTable] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pendingSaleTransaction, setPendingSaleTransaction] = useState(null);
  const [pendingSaleItems, setPendingSaleItems] = useState([]);
  const [transferTransaction, setTransferTransaction] = useState(null);
  const [transferData, setTransferData] = useState({
    toCustomerId: "",
    amount: 0,
    maxAmount: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    gameType: "",
  });
  const [startData, setStartData] = useState({
    additionalPlayers: 0,
    additionalControllers: 0,
  });
  const [stopData, setStopData] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [personSaleItems, setPersonSaleItems] = useState([]);
  const [selectedPersonCustomer, setSelectedPersonCustomer] = useState("");

  // Add Person dialog state
  const [addPersonData, setAddPersonData] = useState({
    additionalPlayers: 0,
    additionalControllers: 0,
  });

  // Discard dialog state
  const [discardData, setDiscardData] = useState({
    reason: "",
    note: "",
  });

  // Expense dialog state
  const [expenseData, setExpenseData] = useState({
    title: "",
    amount: "",
    note: "",
    category: "Other",
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [showBalanceBanner, setShowBalanceBanner] = useState(false);

  useEffect(() => {
    fetchGameTypes();
    fetchCustomers();
    fetchTables();
    fetchTransactions();
    fetchInventoryItems();

    // Check for remaining balance in localStorage
    if (user?.accountType === "Admin") {
      const storedBalance = localStorage.getItem("remainingBalance");
      if (storedBalance && parseFloat(storedBalance) > 0) {
        setRemainingBalance(parseFloat(storedBalance));
        setShowBalanceBanner(true);
      }
    }
  }, []);

  // Timer update effect
  useEffect(() => {
    let transactionRefreshCounter = 0;

    const interval = setInterval(() => {
      setCurrentTime(new Date());

      // Refresh transactions every 30 seconds
      transactionRefreshCounter++;
      if (transactionRefreshCounter >= 30) {
        fetchTransactions();
        transactionRefreshCounter = 0;
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const fetchGameTypes = async () => {
    try {
      const response = await fetch("/api/gametypes");
      const data = await response.json();
      if (data.success) {
        setGameTypes(data.gameTypes);
      }
    } catch (error) {
      console.error("Error fetching game types:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tables");
      const data = await response.json();

      if (data.success) {
        setTables(data.tables);
      } else {
        toast.error(data.message || "Failed to fetch tables");
      }
    } catch (error) {
      toast.error("Error fetching tables");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/pos");
      const data = await response.json();

      setTransactions(data.transactions || []);
      console.log(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      console.log("Inventory API response:", data); // Debug log
      if (data.items) {
        setInventoryItems(data.items);
        console.log("Inventory items loaded:", data.items.length); // Debug log
      } else {
        console.log("No items in response"); // Debug log
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const dismissBalanceBanner = () => {
    setShowBalanceBanner(false);
    setRemainingBalance(0);
    localStorage.removeItem("remainingBalance");
  };

  const handleAddTable = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.gameType) {
      toast.error("Name and game type are required");
      return;
    }

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Table added successfully");
        setIsAddDialogOpen(false);
        setFormData({ name: "", gameType: "" });
        fetchTables();
      } else {
        toast.error(data.message || "Failed to add table");
      }
    } catch (error) {
      toast.error("Error adding table");
    }
  };

  const handleEditTable = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.gameType) {
      toast.error("Name and game type are required");
      return;
    }

    try {
      const response = await fetch(`/api/tables/${currentTable._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Table updated successfully");
        setIsEditDialogOpen(false);
        setCurrentTable(null);
        setFormData({ name: "", gameType: "" });
        fetchTables();
      } else {
        toast.error(data.message || "Failed to update table");
      }
    } catch (error) {
      toast.error("Error updating table");
    }
  };

  const handleDeleteTable = async () => {
    try {
      const response = await fetch(`/api/tables/${currentTable._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Table deleted successfully");
        setIsDeleteDialogOpen(false);
        setCurrentTable(null);
        fetchTables();
      } else {
        toast.error(data.message || "Failed to delete table");
      }
    } catch (error) {
      toast.error("Error deleting table");
    }
  };

  const handleStartTable = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/tables/${currentTable._id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additionalPlayers: parseInt(startData.additionalPlayers) || 0,
          additionalControllers: parseInt(startData.additionalControllers) || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Table started successfully");
        setIsStartDialogOpen(false);
        setCurrentTable(null);
        setStartData({
          additionalPlayers: 0,
          additionalControllers: 0,
        });
        fetchTables();
        fetchCustomers();
      } else {
        toast.error(data.message || "Failed to start table");
      }
    } catch (error) {
      toast.error("Error starting table");
    }
  };

  const handleStopTable = async () => {
    if (!stopData && currentTable) {
      handleStopTableCalculation(currentTable);
    }
  };

  const handlePrintBill = async () => {
    try {
      // Get recorded sales from Zustand store for this table
      const recordedSales = getSalesForTable(currentTable._id);
      const salesTotal = getTotalForTable(currentTable._id);

      // Stop the table and create a completed POS transaction
      const stopResponse = await fetch(`/api/tables/${currentTable._id}/stop`, {
        method: "POST",
      });

      const stopData = await stopResponse.json();

      if (stopData.success) {
        // Calculate total including recorded sales
        const totalBill = stopData.billing.totalCharge + salesTotal;

        // Prepare items array with both table billing and recorded sales items
        const items = [
          {
            itemId: "table-billing", // Special identifier for table billing
            quantity: 1,
            customData: {
              tableName: currentTable.name,
              duration: stopData.billing.duration,
              gameType: currentTable.gameType?.name,
              billing: stopData.billing,
              salesTotal: salesTotal,
              startedBy: currentTable.startedBy, // Include who started the session
            },
          },
        ];

        // Add all recorded sales items as actual inventory items
        recordedSales.forEach((sale) => {
          sale.items.forEach((item) => {
            items.push({
              itemId: item.item._id,
              quantity: item.quantity,
            });
          });
        });

        // Create a POS transaction with table billing + actual inventory items
        const posData = {
          items,
          tableId: currentTable._id,
          total: totalBill,
          status: "completed",
        };

        const posResponse = await fetch("/api/pos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(posData),
        });

        if (posResponse.ok) {
          const transactionData = await posResponse.json();

          // Clear recorded sales from store since they're now in POS transaction
          clearSalesForTable(currentTable._id);

          const message =
            salesTotal > 0
              ? `Table stopped. Bill printed. Table: Rs ${stopData.billing.totalCharge.toFixed(
                  2
                )} + Sales: Rs ${salesTotal.toFixed(
                  2
                )} = Total: Rs ${totalBill.toFixed(2)}`
              : `Table stopped. Bill printed. Total: Rs ${totalBill.toFixed(
                  2
                )}`;

          toast.success(message);
          setIsStopDialogOpen(false);
          setCurrentTable(null);
          setStopData(null);
          fetchTables();
          fetchTransactions();

          // Print receipt with transaction data
          await printReceipt(transactionData);
        } else {
          const errorData = await posResponse.json();
          toast.error(errorData.error || "Failed to create transaction record");
        }
      } else {
        toast.error(stopData.message || "Failed to stop table");
      }
    } catch (error) {
      console.error("Error processing bill:", error);
      toast.error(error.message || "Error processing bill");
    }
  };

  const handleAssignToCustomer = () => {
    setIsCustomerSelectionOpen(true);
  };

  const handleHandover = async () => {
    if (!currentTable || !stopData) {
      toast.error("No table or billing data available");
      return;
    }

    try {
      // Get recorded sales from Zustand store for this table
      const recordedSales = getSalesForTable(currentTable._id);
      const salesTotal = getTotalForTable(currentTable._id);

      // Stop the table
      const stopResponse = await fetch(`/api/tables/${currentTable._id}/stop`, {
        method: "POST",
      });

      const stopDataResponse = await stopResponse.json();

      if (stopDataResponse.success) {
        // Calculate total including recorded sales
        const totalBill = stopDataResponse.billing.totalCharge + salesTotal;

        // Prepare items array with table billing and recorded sales
        const items = [
          {
            itemId: "table-billing",
            quantity: 1,
            customData: {
              tableName: currentTable.name,
              duration: stopDataResponse.billing.duration,
              gameType: currentTable.gameType?.name,
              billing: stopDataResponse.billing,
              salesTotal: salesTotal,
              startedBy: currentTable.startedBy,
            },
          },
        ];

        // Add all recorded sales items as actual inventory items
        recordedSales.forEach((sale) => {
          sale.items.forEach((item) => {
            items.push({
              itemId: item.item._id,
              quantity: item.quantity,
            });
          });
        });

        // Create a POS transaction with table billing + actual inventory items
        const posData = {
          items,
          tableId: currentTable._id,
          total: totalBill,
          status: "pending", // Handover is always pending
        };

        const posResponse = await fetch("/api/pos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(posData),
        });

        if (posResponse.ok) {
          // Create a remaining balance record
          const remainingData = {
            remainingBalance: totalBill,
            remainingOf: currentTable.startedBy?._id || currentTable.startedBy,
          };

          await fetch("/api/remaining", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(remainingData),
          });

          // Clear recorded sales from store since they're now in POS transaction
          clearSalesForTable(currentTable._id);

          const message =
            salesTotal > 0
              ? `Table handed over. Table: Rs ${stopDataResponse.billing.totalCharge.toFixed(
                  2
                )} + Sales: Rs ${salesTotal.toFixed(
                  2
                )} = Total: Rs ${totalBill.toFixed(2)}`
              : `Table handed over. Total: Rs ${totalBill.toFixed(2)}`;

          toast.success(message);
          setIsStopDialogOpen(false);
          setCurrentTable(null);
          setStopData(null);
          fetchTables();
          fetchTransactions();
        } else {
          const errorData = await posResponse.json();
          toast.error(errorData.error || "Failed to create transaction record");
        }
      } else {
        toast.error(stopDataResponse.message || "Failed to stop table");
      }
    } catch (error) {
      console.error("Error processing handover:", error);
      toast.error(error.message || "Error processing handover");
    }
  };

  // Helper functions for multiple customer selection
  const toggleCustomerSelection = (customer) => {
    setSelectedCustomers((prev) => {
      const isSelected = prev.some((c) => c._id === customer._id);
      if (isSelected) {
        return prev.filter((c) => c._id !== customer._id);
      } else {
        return [...prev, customer];
      }
    });
  };

  const isCustomerSelected = (customer) => {
    return selectedCustomers.some((c) => c._id === customer._id);
  };

  // Record Sale functions
  const openRecordSaleDialog = (table) => {
    setCurrentTable(table);
    setSaleItems([]);
    setIsRecordSaleOpen(true);
  };

  const addSaleItem = (item) => {
    const existingItem = saleItems.find(
      (saleItem) => saleItem._id === item._id
    );
    if (existingItem) {
      setSaleItems((prev) =>
        prev.map((saleItem) =>
          saleItem._id === item._id
            ? { ...saleItem, quantity: saleItem.quantity + 1 }
            : saleItem
        )
      );
    } else {
      setSaleItems((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const removeSaleItem = (itemId) => {
    setSaleItems((prev) => prev.filter((item) => item._id !== itemId));
  };

  const updateSaleItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeSaleItem(itemId);
    } else {
      setSaleItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, quantity } : item))
      );
    }
  };

  const calculateSaleTotal = () => {
    return saleItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleRecordSale = async () => {
    if (saleItems.length === 0) {
      toast.error("Please add items to record a sale");
      return;
    }

    if (!currentTable) {
      toast.error("No table selected");
      return;
    }

    try {
      // Store the sale in Zustand store instead of creating POS transaction
      const saleData = {
        items: saleItems.map((item) => ({
          item: {
            _id: item._id,
            name: item.name,
            price: item.price,
          },
          quantity: item.quantity,
          priceAtTime: item.price,
        })),
        total: calculateSaleTotal(),
      };

      // Add sale to the store for this table
      addSaleToTable(currentTable._id, saleData);

      toast.success(
        `Sale recorded for ${currentTable.name}. Items: ${
          saleItems.length
        }, Total: Rs ${calculateSaleTotal().toFixed(2)}`
      );

      setIsRecordSaleOpen(false);
      setSaleItems([]);
      setCurrentTable(null);

      // No need to fetch transactions since we're not creating one yet
    } catch (error) {
      toast.error("Error recording sale");
    }
  };

  // Person Sale functions
  const addPersonSaleItem = (item) => {
    setPersonSaleItems((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removePersonSaleItem = (itemId) => {
    setPersonSaleItems((prev) => prev.filter((item) => item._id !== itemId));
  };

  const updatePersonSaleItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removePersonSaleItem(itemId);
      return;
    }
    setPersonSaleItems((prev) =>
      prev.map((item) => (item._id === itemId ? { ...item, quantity } : item))
    );
  };

  const calculatePersonSaleTotal = () => {
    return personSaleItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleRecordPersonSale = async () => {
    if (personSaleItems.length === 0) {
      toast.error("Please add items to record a sale");
      return;
    }

    if (!selectedPersonCustomer) {
      toast.error("Please select a customer");
      return;
    }

    try {
      // Create a POS transaction for the person sale
      const posData = {
        items: personSaleItems.map((item) => ({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customerId: selectedPersonCustomer,
        total: calculatePersonSaleTotal(),
        status: "pending",
      };

      // If a table is selected, include table context
      if (currentTable) {
        posData.tableId = currentTable._id;

        // If this table has a startedBy user, include that in customData for proper attribution
        if (currentTable.startedBy) {
          posData.customData = {
            startedBy: currentTable.startedBy._id,
            type: "person-sale",
            tableName: currentTable.name,
          };
        }
      }

      const response = await fetch("/api/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(posData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const data = await response.json();

      toast.success(
        `Person sale recorded successfully. Items: ${
          personSaleItems.length
        }, Total: Rs ${calculatePersonSaleTotal().toFixed(2)}${
          currentTable ? ` (Linked to ${currentTable.name})` : ""
        }`
      );

      setIsRecordPersonSaleOpen(false);
      setPersonSaleItems([]);
      setSelectedPersonCustomer("");
      setCurrentTable(null); // Reset table selection

      // Refresh transactions to show the new one
      fetchTransactions();
    } catch (error) {
      console.error("Error recording person sale:", error);
      toast.error(error.message || "Error recording person sale");
    }
  };

  // Handle transaction click to show details
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailsOpen(true);
  };

  // Mark transaction as paid - now opens modification dialog for pending sales
  const handleMarkAsPaid = async (transactionId, e) => {
    // Prevent event bubbling to avoid opening transaction details
    e.stopPropagation();

    // Find the transaction to get its details
    const transaction = transactions.find((t) => t._id === transactionId);
    if (!transaction) {
      toast.error("Transaction not found");
      return;
    }

    console.log("Transaction items:", transaction.items); // Debug log

    // Transform transaction items to match the expected structure
    const transformedItems = (transaction.items || []).map((item, index) => ({
      // Handle both possible structures: direct properties or nested item object
      itemId: item.item?._id || item.itemId || item._id,
      name: item.item?.name || item.name || `Item ${index + 1}`,
      price: item.priceAtTime || item.price || item.item?.price || 0,
      quantity: item.quantity || 1,
    }));

    console.log("Transformed items:", transformedItems); // Debug log

    // Set up the pending sale modification dialog
    setPendingSaleTransaction(transaction);
    setPendingSaleItems(transformedItems);
    setIsPendingSaleDialogOpen(true);
  };

  // Functions for handling pending sale modifications
  const addItemToPendingSale = (item) => {
    const existingItem = pendingSaleItems.find(
      (saleItem) =>
        saleItem.itemId === item._id || saleItem.itemId === item.itemId
    );
    if (existingItem) {
      setPendingSaleItems((prev) =>
        prev.map((saleItem) =>
          saleItem.itemId === item._id || saleItem.itemId === item.itemId
            ? { ...saleItem, quantity: saleItem.quantity + 1 }
            : saleItem
        )
      );
    } else {
      setPendingSaleItems((prev) => [
        ...prev,
        {
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeItemFromPendingSale = (itemIndex) => {
    setPendingSaleItems((prev) =>
      prev.filter((_, index) => index !== itemIndex)
    );
  };

  const updatePendingSaleItemQuantity = (itemIndex, quantity) => {
    if (quantity <= 0) {
      removeItemFromPendingSale(itemIndex);
    } else {
      setPendingSaleItems((prev) =>
        prev.map((item, index) =>
          index === itemIndex ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculatePendingSaleTotal = () => {
    return pendingSaleItems.reduce(
      (total, item) => total + (item.price || 0) * item.quantity,
      0
    );
  };

  const handleConfirmPendingSale = async () => {
    if (pendingSaleItems.length === 0) {
      toast.error("Cannot mark sale as paid with no items");
      return;
    }

    try {
      // Transform back to the API format
      const apiItems = pendingSaleItems.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      // Update the transaction with modified items and mark as completed
      const response = await fetch(`/api/pos/${pendingSaleTransaction._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          items: apiItems,
          total: calculatePendingSaleTotal(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      const updatedTransaction = await response.json();

      // Update the local transactions state
      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction._id === pendingSaleTransaction._id
            ? {
                ...transaction,
                status: "completed",
                items: apiItems,
                total: calculatePendingSaleTotal(),
              }
            : transaction
        )
      );

      toast.success("Sale marked as paid successfully");
      setIsPendingSaleDialogOpen(false);
      setPendingSaleTransaction(null);
      setPendingSaleItems([]);

      // Print receipt if shouldPrint flag is set
      if (updatedTransaction.shouldPrint) {
        await printReceipt(updatedTransaction);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to mark sale as paid");
    }
  };

  // Handle bill transfer/split
  const handleTransferBill = (transaction, e) => {
    // Prevent event bubbling to avoid opening transaction details
    e.stopPropagation();

    setTransferTransaction(transaction);
    setTransferData({
      toCustomerId: "",
      amount: 0,
      maxAmount: transaction.total,
    });
    setIsTransferDialogOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!transferData.toCustomerId) {
      toast.error("Please select a customer to transfer to");
      return;
    }

    if (
      transferData.amount <= 0 ||
      transferData.amount > transferData.maxAmount
    ) {
      toast.error(`Amount must be between Rs1 and Rs${transferData.maxAmount}`);
      return;
    }

    try {
      // Call API to split the transaction
      const response = await fetch(
        `/api/pos/${transferTransaction._id}/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toCustomerId: transferData.toCustomerId,
            amount: transferData.amount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to transfer bill");
      }

      const result = await response.json();

      // Update local transactions state
      setTransactions((prev) => {
        if (result.isFullTransfer) {
          // For full transfer, just replace the original transaction with the updated one
          return prev.map((t) =>
            t._id === transferTransaction._id ? result.transactions[0] : t
          );
        } else {
          // For partial transfer, remove original and add both new transactions
          const filtered = prev.filter(
            (t) => t._id !== transferTransaction._id
          );
          return [...filtered, ...result.transactions];
        }
      });

      const successMessage = result.isFullTransfer
        ? `Full bill transferred to ${
            result.transactions[0]?.customer?.name || "customer"
          }`
        : `Bill transferred successfully: Rs${transferData.amount} to ${
            result.transactions.find(
              (t) => t.customer?._id === transferData.toCustomerId
            )?.customer?.name || "customer"
          }`;

      toast.success(successMessage);

      setIsTransferDialogOpen(false);
      setTransferTransaction(null);
      setTransferData({ toCustomerId: "", amount: 0, maxAmount: 0 });

      // Refresh transactions to ensure UI updates
      fetchTransactions();
    } catch (error) {
      console.error("Error transferring bill:", error);
      toast.error("Failed to transfer bill");
    }
  };

  const handleCustomerAssignment = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    try {
      // Get recorded sales from Zustand store for this table
      const recordedSales = getSalesForTable(currentTable._id);
      const salesTotal = getTotalForTable(currentTable._id);

      // Stop the table
      const stopResponse = await fetch(`/api/tables/${currentTable._id}/stop`, {
        method: "POST",
      });

      const stopDataResponse = await stopResponse.json();

      if (stopDataResponse.success) {
        // Calculate total including recorded sales
        const totalBill = stopDataResponse.billing.totalCharge + salesTotal;

        // Calculate amount per customer (split equally)
        const tableBillingPerCustomer =
          stopDataResponse.billing.totalCharge / selectedCustomers.length;
        const salesPerCustomer = salesTotal / selectedCustomers.length;
        const amountPerCustomer = tableBillingPerCustomer + salesPerCustomer;

        console.log("=== BILL SPLITTING DEBUG ===");
        console.log("Table Charge:", stopDataResponse.billing.totalCharge);
        console.log("Sales Total:", salesTotal);
        console.log("Total Bill:", totalBill);
        console.log("Number of Customers:", selectedCustomers.length);
        console.log("Table Billing Per Customer:", tableBillingPerCustomer);
        console.log("Sales Per Customer:", salesPerCustomer);
        console.log("Amount Per Customer:", amountPerCustomer);
        console.log("Recorded Sales:", recordedSales);

        // Create multiple POS transactions (one for each customer)
        const transactionPromises = selectedCustomers.map(async (customer) => {
          // For transactions with ONLY table billing (no recorded sales)
          if (recordedSales.length === 0) {
            const posData = {
              items: [
                {
                  itemId: "table-billing",
                  quantity: 1,
                  customData: {
                    tableName: currentTable.name,
                    duration: stopDataResponse.billing.duration,
                    gameType: currentTable.gameType?.name,
                    billing: {
                      ...stopDataResponse.billing,
                      totalCharge: tableBillingPerCustomer, // Split table billing amount
                      originalTotal: totalBill,
                      originalTableTotal: stopDataResponse.billing.totalCharge,
                      salesTotal: 0,
                      splitBetween: selectedCustomers.length,
                    },
                    startedBy: currentTable.startedBy, // Include who started the session
                  },
                },
              ],
              tableId: currentTable._id,
              customerId: customer._id,
              total: tableBillingPerCustomer, // Just the split table amount
              status: "pending",
            };

            console.log(
              "Table-only POS Data for customer",
              customer.name,
              ":",
              posData
            );

            return fetch("/api/pos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(posData),
            });
          }

          // For transactions with table billing + recorded sales
          // Prepare items array with table billing
          const items = [
            {
              itemId: "table-billing",
              quantity: 1,
              customData: {
                tableName: currentTable.name,
                duration: stopDataResponse.billing.duration,
                gameType: currentTable.gameType?.name,
                billing: {
                  ...stopDataResponse.billing,
                  totalCharge: tableBillingPerCustomer, // Split table billing amount
                  originalTotal: totalBill, // Keep original total including sales
                  originalTableTotal: stopDataResponse.billing.totalCharge,
                  salesTotal: salesTotal,
                  salesPerCustomer: salesPerCustomer, // Split sales amount per customer
                  splitBetween: selectedCustomers.length,
                },
                // Store the complete sales information for reference
                includedSales: recordedSales.map((sale) => ({
                  id: sale.id,
                  total: sale.total,
                  items: sale.items,
                  splitTotal: sale.total / selectedCustomers.length, // Split amount for this sale
                })),
                startedBy: currentTable.startedBy, // Include who started the session
              },
            },
          ];

          // Include recorded sales items with proportional quantities
          recordedSales.forEach((sale) => {
            sale.items.forEach((item) => {
              // Split quantity proportionally
              const splitQuantity = item.quantity / selectedCustomers.length;
              const roundedQuantity = Math.max(0.1, splitQuantity); // Minimum quantity for record keeping

              items.push({
                itemId: item.item._id,
                quantity: parseFloat(roundedQuantity.toFixed(2)), // Keep decimals for accurate splitting
              });
            });
          });

          const posData = {
            items,
            tableId: currentTable._id,
            customerId: customer._id,
            total: amountPerCustomer, // Force this total for accurate splitting
            status: "pending",
          };

          console.log(
            "Full POS Data for customer",
            customer.name,
            ":",
            posData
          );

          return fetch("/api/pos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(posData),
          });
        });

        // Wait for all transactions to be created
        const results = await Promise.all(transactionPromises);

        // Check if all transactions were successful
        const allSuccessful = results.every((response) => response.ok);

        if (allSuccessful) {
          // Clear recorded sales from store since they're now in POS transactions
          clearSalesForTable(currentTable._id);

          const customerNames = selectedCustomers.map((c) => c.name).join(", ");
          const message =
            selectedCustomers.length === 1
              ? salesTotal > 0
                ? `Table stopped. Bill assigned to ${customerNames}. Table: Rs ${stopDataResponse.billing.totalCharge.toFixed(
                    2
                  )} + Sales: Rs ${salesTotal.toFixed(
                    2
                  )} = Total: Rs ${totalBill.toFixed(2)}`
                : `Table stopped. Bill assigned to ${customerNames}. Total: Rs ${totalBill.toFixed(
                    2
                  )}`
              : salesTotal > 0
              ? `Table stopped. Bill split between ${
                  selectedCustomers.length
                } customers (${customerNames}). Table: Rs ${stopDataResponse.billing.totalCharge.toFixed(
                  2
                )} + Sales: Rs ${salesTotal.toFixed(
                  2
                )} = Rs ${amountPerCustomer.toFixed(2)} each.`
              : `Table stopped. Bill split between ${
                  selectedCustomers.length
                } customers (${customerNames}). Rs ${amountPerCustomer.toFixed(
                  2
                )} each.`;

          toast.success(message);
          setIsStopDialogOpen(false);
          setIsCustomerSelectionOpen(false);
          setCurrentTable(null);
          setStopData(null);
          setSelectedCustomers([]);
          setCustomerSearch("");
          fetchTables();
          fetchTransactions();
        } else {
          toast.error("Failed to create some transaction records");
        }
      } else {
        toast.error(stopDataResponse.message || "Failed to stop table");
      }
    } catch (error) {
      toast.error("Error assigning bill to customers");
    }
  };

  const openEditDialog = (table) => {
    setCurrentTable(table);
    setFormData({
      name: table.name,
      gameType: table.gameType._id,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (table) => {
    setCurrentTable(table);
    setIsDeleteDialogOpen(true);
  };

  const openStartDialog = (table) => {
    setCurrentTable(table);
    setIsStartDialogOpen(true);
  };

  const openStopDialog = (table) => {
    setCurrentTable(table);
    setStopData(null); // Reset stop data
    setIsStopDialogOpen(true);
    // Automatically calculate billing when dialog opens
    setTimeout(() => {
      if (table) {
        handleStopTableCalculation(table);
      }
    }, 100);
  };

  const openAddPersonDialog = (table) => {
    setCurrentTable(table);
    setAddPersonData({
      additionalPlayers: 0,
      additionalControllers: 0,
    });
    setIsAddPersonDialogOpen(true);
  };

  const handleAddPerson = async () => {
    if (!currentTable) {
      toast.error("No table selected");
      return;
    }

    try {
      const response = await fetch(`/api/tables/${currentTable._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          additionalPlayers:
            currentTable.additionalPlayers +
            parseInt(addPersonData.additionalPlayers || 0),
          additionalControllers:
            currentTable.additionalControllers +
            parseInt(addPersonData.additionalControllers || 0),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Added ${addPersonData.additionalPlayers || 0} players and ${
            addPersonData.additionalControllers || 0
          } controllers to ${currentTable.name}`
        );
        setIsAddPersonDialogOpen(false);
        setAddPersonData({
          additionalPlayers: 0,
          additionalControllers: 0,
        });
        setCurrentTable(null);
        fetchTables(); // Refresh tables to show updated counts
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to add persons");
      }
    } catch (error) {
      console.error("Error adding persons:", error);
      toast.error("Error adding persons");
    }
  };

  const openDiscardDialog = (table) => {
    setCurrentTable(table);
    setDiscardData({
      reason: "",
      note: "",
    });
    setIsDiscardDialogOpen(true);
  };

  const handleDiscardTable = async () => {
    if (!currentTable) {
      toast.error("No table selected");
      return;
    }

    if (!discardData.reason) {
      toast.error("Please select a reason for discarding");
      return;
    }

    try {
      const response = await fetch(`/api/tables/${currentTable._id}/discard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: discardData.reason,
          note: discardData.note,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Clear any recorded sales from Zustand store
        clearSalesForTable(currentTable._id);

        toast.success(
          `${currentTable.name} discarded successfully - No charges applied`
        );
        setIsDiscardDialogOpen(false);
        setDiscardData({
          reason: "",
          note: "",
        });
        setCurrentTable(null);
        fetchTables(); // Refresh tables
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to discard table");
      }
    } catch (error) {
      console.error("Error discarding table:", error);
      toast.error("Error discarding table");
    }
  };

  const handleAddExpense = async () => {
    if (!expenseData.title.trim() || !expenseData.amount) {
      toast.error("Please fill in title and amount");
      return;
    }

    if (parseFloat(expenseData.amount) < 0) {
      toast.error("Amount cannot be negative");
      return;
    }

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: expenseData.title.trim(),
          amount: parseFloat(expenseData.amount),
          note: expenseData.note.trim(),
          category: expenseData.category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Expense "${expenseData.title}" added successfully - Rs ${parseFloat(
            expenseData.amount
          ).toFixed(2)}`
        );
        setIsAddExpenseDialogOpen(false);
        setExpenseData({
          title: "",
          amount: "",
          note: "",
          category: "Other",
        });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Error adding expense");
    }
  };

  const handleStopTableCalculation = async (table) => {
    try {
      const response = await fetch(`/api/tables/${table._id}/stop`, {
        method: "GET",
      });

      const data = await response.json();

      if (data.success) {
        setStopData(data.billing);
      } else {
        toast.error(data.message || "Failed to calculate billing");
      }
    } catch (error) {
      toast.error("Error calculating billing");
    }
  };

  const calculateDuration = (startTime) => {
    if (!startTime) return "00:00:00";
    const now = currentTime;
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / 1000); // seconds

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const canDiscard = (startTime) => {
    if (!startTime) return false;
    const now = currentTime;
    const start = new Date(startTime);
    const diffInMinutes = Math.floor((now - start) / (1000 * 60));
    return diffInMinutes < 10; // Can discard within first 10 minutes
  };

  // Helper function to check if game type supports Add Person and Discard features
  const supportsAddPersonAndDiscard = (gameTypeName) => {
    if (!gameTypeName) return false;
    const name = gameTypeName.toLowerCase();
    return name.includes("playstation") || name.includes("table tennis");
  };

  const groupTablesByGameType = () => {
    const grouped = {};
    tables.forEach((table) => {
      const gameTypeName = table.gameType?.name || "Uncategorized";
      if (!grouped[gameTypeName]) {
        grouped[gameTypeName] = [];
      }
      grouped[gameTypeName].push(table);
    });

    // Define the preferred order
    const preferredOrder = [
      "Premium Snooker",
      "Snooker",
      "Pool",
      "Table Tennis",
      "PlayStation 5 Basic",
      "PlayStation 5 Premium Lounge",
    ];

    // Create ordered object
    const ordered = {};

    // Add game types in preferred order
    preferredOrder.forEach((gameType) => {
      if (grouped[gameType]) {
        ordered[gameType] = grouped[gameType];
      }
    });

    // Add any remaining game types not in the preferred order
    Object.keys(grouped).forEach((gameType) => {
      if (!preferredOrder.includes(gameType)) {
        ordered[gameType] = grouped[gameType];
      }
    });

    return ordered;
  };

  // Permission checks
  const canManage = user?.accountType !== "Admin"; // For table creation/editing/deletion
  const canOperate = user?.accountType === "Admin"; // For table operations (start/stop/sales/payments)
  const groupedTables = groupTablesByGameType();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-2 md:p-4 w-full">
        {/* Remaining Balance Banner */}
        {showBalanceBanner && remainingBalance > 0 && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Previous Session Running Tables Balance
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    There were running tables when the previous admin logged
                    out.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Estimated Balance
                  </p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    Rs {remainingBalance.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissBalanceBanner}
                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Tables Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                Monitor and manage all gaming tables
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canOperate && (
                <>
                  <Button
                    onClick={() => setIsRecordPersonSaleOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Store className="w-4 h-4" />
                    Record Person Sale
                  </Button>

                  <Button
                    onClick={() => setIsAddExpenseDialogOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    Add Expense
                  </Button>
                </>
              )}
              {canManage && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Table
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Tables (takes 2/3 width) */}
          <div className="xl:col-span-2">
            {/* Tables by Game Type */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p>Loading tables...</p>
                </div>
              </div>
            ) : Object.keys(groupedTables).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <TableProperties className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No tables found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first gaming table.
                  </p>
                  {canManage && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Table
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedTables).map(
                  ([gameTypeName, gameTables]) => (
                    <div key={gameTypeName} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">
                          {gameTypeName}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {gameTables.length} table
                            {gameTables.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {gameTables.map((table, index) => {
                          const isTableAvailable = table.status === "off";

                          return (
                            <div key={table._id}>
                              <div
                                className={`flex flex-col lg:flex-row lg:items-center justify-between p-2 rounded border transition-all duration-200 hover:shadow-sm space-y-2 lg:space-y-0 ${
                                  table.status === "on"
                                    ? "border-green-500/50 bg-green-500/5"
                                    : "border-border hover:border-primary/20 bg-card"
                                }`}
                              >
                                {/* Left section - Table info */}
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        table.status === "on"
                                          ? "bg-green-500"
                                          : "bg-muted-foreground"
                                      }`}
                                    />
                                    <div>
                                      <h3 className="font-semibold text-sm">
                                        {table.name}
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        Rs {table.gameType?.chargeAmount} •{" "}
                                        {table.gameType?.chargeType}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Status and session info */}
                                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 lg:ml-4">
                                    <div
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium self-start ${
                                        table.status === "on"
                                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {table.status === "on"
                                        ? "Active"
                                        : "Available"}
                                    </div>

                                    {table.status === "on" && (
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-green-600" />
                                          <span className="font-mono font-semibold">
                                            {calculateDuration(table.startTime)}
                                          </span>
                                        </div>
                                        {(table.additionalPlayers > 0 ||
                                          table.additionalControllers > 0) && (
                                          <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 text-blue-600" />
                                            <span className="text-blue-600 font-medium">
                                              {table.additionalPlayers}P{" "}
                                              {table.additionalControllers}C
                                            </span>
                                          </div>
                                        )}
                                        {canDiscard(table.startTime) &&
                                          supportsAddPersonAndDiscard(
                                            table.gameType?.name
                                          ) && (
                                            <div className="flex items-center gap-1">
                                              <X className="w-3 h-3 text-orange-500" />
                                              <span className="text-orange-500 font-medium text-xs">
                                                Can Discard
                                              </span>
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right section - Action buttons */}
                                <div className="flex items-center gap-1 lg:ml-2">
                                  {table.status === "off" ? (
                                    canOperate && (
                                      <Button
                                        onClick={() => openStartDialog(table)}
                                        className="flex items-center gap-1 h-6 px-2 text-xs"
                                        size="sm"
                                        disabled={!isTableAvailable}
                                      >
                                        <Play className="w-3 h-3" />
                                        Start
                                      </Button>
                                    )
                                  ) : (
                                    <>
                                      {canOperate && (
                                        <>
                                          <Button
                                            onClick={() =>
                                              openStopDialog(table)
                                            }
                                            variant="destructive"
                                            className="flex items-center gap-1 h-6 px-2 text-xs"
                                            size="sm"
                                          >
                                            <Square className="w-3 h-3" />
                                            End
                                          </Button>
                                          {canDiscard(table.startTime) &&
                                            supportsAddPersonAndDiscard(
                                              table.gameType?.name
                                            ) && (
                                              <Button
                                                onClick={() =>
                                                  openDiscardDialog(table)
                                                }
                                                variant="outline"
                                                className="flex items-center gap-1 h-6 px-2 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                                                size="sm"
                                              >
                                                <X className="w-3 h-3" />
                                                Discard
                                              </Button>
                                            )}
                                          {supportsAddPersonAndDiscard(
                                            table.gameType?.name
                                          ) && (
                                            <Button
                                              onClick={() =>
                                                openAddPersonDialog(table)
                                              }
                                              variant="outline"
                                              className="flex items-center gap-1 h-6 px-2 text-xs"
                                              size="sm"
                                            >
                                              <UserPlus className="w-3 h-3" />
                                              Add Person
                                            </Button>
                                          )}
                                          <Button
                                            onClick={() =>
                                              openRecordSaleDialog(table)
                                            }
                                            variant="outline"
                                            className="flex items-center gap-1 h-6 px-2 text-xs"
                                            size="sm"
                                          >
                                            <Store className="w-3 h-3" />
                                            Record Sale
                                          </Button>
                                        </>
                                      )}
                                    </>
                                  )}

                                  {canManage && table.status === "off" && (
                                    <>
                                      <Button
                                        onClick={() => openEditDialog(table)}
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        onClick={() => openDeleteDialog(table)}
                                        variant="destructive"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {index < gameTables.length - 1 && (
                                <div className="h-px bg-border/50 my-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Right Column - Recent Transactions (takes 1/3 width) */}
          <div className="h-screen">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <CardDescription className="text-sm">
                  Latest POS transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 h-full pb-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {transactions.slice(0, 25).map((transaction) => (
                      <div
                        key={transaction._id}
                        className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {transaction.table?.name || "Person Sale"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                }`}
                              >
                                {transaction.status === "completed" ? "✓" : "○"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.customer?.name || "Walk-in"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              Rs {transaction.total?.toFixed(2) || "0.00"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Simple preview for different transaction types */}
                        <div className="border-t pt-2">
                          <div className="text-xs text-muted-foreground">
                            {transaction.items &&
                            transaction.items.length > 0 ? (
                              <span>
                                {transaction.items.length} item
                                {transaction.items.length > 1 ? "s" : ""} •
                                Click for details
                              </span>
                            ) : transaction.customData ? (
                              <span>
                                Table billing •{" "}
                                {transaction.customData.gameType} • Click for
                                details
                              </span>
                            ) : (
                              <span>Click for details</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            By: {transaction.createdBy?.username || "Unknown"}
                          </span>
                          {transaction.status === "pending" && canOperate && (
                            <div className="flex gap-1">
                              <Button
                                onClick={(e) =>
                                  handleTransferBill(transaction, e)
                                }
                                size="sm"
                                className="h-6 px-2 text-xs bg-blue-500/30 text-white"
                              >
                                Transfer
                              </Button>
                              <Button
                                onClick={(e) =>
                                  handleMarkAsPaid(transaction._id, e)
                                }
                                size="sm"
                                className="h-6 px-2 text-xs bg-green-500/30 text-white"
                              >
                                Mark as Paid
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Create a new table for your game type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTable}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Snooker Table 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameType">Game Type *</Label>
                <Select
                  value={formData.gameType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gameType: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select game type" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameTypes
                      .filter((gameType) => gameType && gameType._id)
                      .map((gameType) => (
                        <SelectItem key={gameType._id} value={gameType._id}>
                          {gameType.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setFormData({ name: "", gameType: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update table information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTable}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Table Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Snooker Table 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gameType">Game Type *</Label>
                <Select
                  value={formData.gameType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gameType: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select game type" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameTypes
                      .filter((gameType) => gameType && gameType._id)
                      .map((gameType) => (
                        <SelectItem key={gameType._id} value={gameType._id}>
                          {gameType.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setCurrentTable(null);
                  setFormData({ name: "", gameType: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {currentTable?.name}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCurrentTable(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Table Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Table - {currentTable?.name}</DialogTitle>
            <DialogDescription>
              Confirm to start the gaming session for this table.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartTable}>
            <div className="space-y-6">
              {/* Table Information */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Game Type:
                  </span>
                  <span className="text-sm font-medium">
                    {currentTable?.gameType?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rate:</span>
                  <span className="text-sm font-medium">
                    Rs {currentTable?.gameType?.chargeAmount} per{" "}
                    {currentTable?.gameType?.chargeType}
                  </span>
                </div>
              </div>

              {/* Only show additional charges if the game type supports them */}
              {(currentTable?.gameType?.additionalPersonCharge > 0 ||
                currentTable?.gameType?.additionalControllerCharge > 0) && (
                <div className="border-t pt-6">
                  <p className="text-sm font-medium mb-4">
                    Additional Charges (Optional)
                  </p>
                  <div className="space-y-4">
                    {currentTable?.gameType?.additionalPersonCharge > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="additional-players">
                          Additional Players (Rs{" "}
                          {currentTable.gameType.additionalPersonCharge} each)
                        </Label>
                        <Input
                          id="additional-players"
                          type="number"
                          min="0"
                          max="10"
                          value={startData.additionalPlayers}
                          onChange={(e) =>
                            setStartData({
                              ...startData,
                              additionalPlayers: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                    {currentTable?.gameType?.additionalControllerCharge > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="additional-controllers">
                          Additional Controllers (Rs{" "}
                          {currentTable.gameType.additionalControllerCharge}{" "}
                          each)
                        </Label>
                        <Input
                          id="additional-controllers"
                          type="number"
                          min="0"
                          max="10"
                          value={startData.additionalControllers}
                          onChange={(e) =>
                            setStartData({
                              ...startData,
                              additionalControllers: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStartDialogOpen(false);
                  setCurrentTable(null);
                  setStartData({
                    additionalPlayers: 0,
                    additionalControllers: 0,
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Confirm & Start Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stop Table Dialog */}
      <Dialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Table Session - {currentTable?.name}</DialogTitle>
            <DialogDescription>
              Review the bill details and choose how to process the payment.
            </DialogDescription>
          </DialogHeader>

          {stopData ? (
            <div className="space-y-4">
              {/* Bill Details */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg">Bill Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>
                      {Math.floor(stopData.duration / 60)}h{" "}
                      {stopData.duration % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Charge:</span>
                    <span>Rs {stopData.baseCharge.toFixed(2)}</span>
                  </div>
                  {stopData.additionalPlayerCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Players:</span>
                      <span>
                        Rs {stopData.additionalPlayerCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {stopData.additionalControllerCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Controllers:</span>
                      <span>
                        Rs {stopData.additionalControllerCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Table Total:</span>
                    <span>Rs {stopData.totalCharge.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Recorded Sales */}
              {(() => {
                if (!currentTable) return null;

                const recordedSales = getSalesForTable(currentTable._id);
                const salesTotal = getTotalForTable(currentTable._id);

                const handleRemoveItem = (saleId, itemIndex) => {
                  removeItemFromSale(currentTable._id, saleId, itemIndex);
                };

                const handleUpdateQuantity = (
                  saleId,
                  itemIndex,
                  newQuantity
                ) => {
                  if (newQuantity <= 0) {
                    removeItemFromSale(currentTable._id, saleId, itemIndex);
                  } else {
                    updateItemQuantityInSale(
                      currentTable._id,
                      saleId,
                      itemIndex,
                      newQuantity
                    );
                  }
                };

                return (
                  recordedSales.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">
                          Recorded Sales
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          Click × to remove returned/unused items
                        </span>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {recordedSales.map((sale, saleIndex) => (
                          <div
                            key={sale.id}
                            className="bg-muted/30 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-sm">
                                Sale #{saleIndex + 1}
                              </h4>
                              <span className="font-semibold text-sm">
                                Rs {sale.total.toFixed(2)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {sale.items.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="flex items-center justify-between bg-background rounded p-2 border"
                                >
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-sm">
                                        {item.item?.name || "Item"}
                                      </span>
                                      <span className="font-medium text-sm">
                                        Rs{" "}
                                        {(
                                          (item.priceAtTime || 0) *
                                          item.quantity
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              sale.id,
                                              itemIndex,
                                              item.quantity - 1
                                            )
                                          }
                                        >
                                          -
                                        </Button>
                                        <span className="text-xs px-2">
                                          {item.quantity}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            handleUpdateQuantity(
                                              sale.id,
                                              itemIndex,
                                              item.quantity + 1
                                            )
                                          }
                                        >
                                          +
                                        </Button>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        @ Rs{" "}
                                        {(item.priceAtTime || 0).toFixed(2)}{" "}
                                        each
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-2"
                                    onClick={() =>
                                      handleRemoveItem(sale.id, itemIndex)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                              Recorded:{" "}
                              {new Date(sale.createdAt).toLocaleTimeString()}
                              {sale.updatedAt && (
                                <span className="ml-2">
                                  • Modified:{" "}
                                  {new Date(
                                    sale.updatedAt
                                  ).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total Sales:</span>
                          <span>Rs {salesTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Final Total */}
              {(() => {
                if (!currentTable) return null;

                const recordedSales = getSalesForTable(currentTable._id);
                const salesTotal = getTotalForTable(currentTable._id);
                const finalTotal = stopData.totalCharge + salesTotal;

                return (
                  salesTotal > 0 && (
                    <div className="border-2 border-primary rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Grand Total:</span>
                        <span className="font-bold text-xl text-primary">
                          Rs {finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button onClick={handlePrintBill} className="w-full">
                  Print Bill & Complete
                </Button>
                <Button
                  onClick={handleAssignToCustomer}
                  variant="outline"
                  className="w-full"
                >
                  Assign to Customer
                </Button>
                <Button
                  onClick={handleHandover}
                  variant="secondary"
                  className="w-full"
                >
                  Handover (No Customer)
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Calculating bill...
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStopDialogOpen(false);
                setCurrentTable(null);
                setStopData(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog
        open={isCustomerSelectionOpen}
        onOpenChange={setIsCustomerSelectionOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Bill to Customer</DialogTitle>
            <DialogDescription>
              Search and select a customer to assign this bill to. The
              transaction will be marked as pending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="customerSearch" className="text-sm font-medium">
                Search Customer
              </Label>
              <Input
                id="customerSearch"
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Customer List */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">
                Select customers to split the bill between
              </div>

              {/* Bill Division Preview */}
              {selectedCustomers.length > 0 && stopData && currentTable && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                  <div className="text-sm font-medium mb-1">Bill Division</div>
                  {(() => {
                    const recordedSalesTotal = getTotalForTable(
                      currentTable._id
                    );
                    const totalBill = stopData.totalCharge + recordedSalesTotal;
                    const amountPerCustomer =
                      totalBill / selectedCustomers.length;

                    return (
                      <div className="space-y-1">
                        {/* Show breakdown if there are recorded sales */}
                        {recordedSalesTotal > 0 ? (
                          <>
                            <div className="text-xs text-muted-foreground">
                              Table: Rs {stopData.totalCharge.toFixed(2)} +
                              Sales: Rs {recordedSalesTotal.toFixed(2)} = Rs{" "}
                              {totalBill.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Total: Rs {totalBill.toFixed(2)} ÷{" "}
                              {selectedCustomers.length} customers =
                              <span className="font-semibold text-primary ml-1">
                                Rs {amountPerCustomer.toFixed(2)} each
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Total: Rs {stopData.totalCharge.toFixed(2)} ÷{" "}
                            {selectedCustomers.length} customers =
                            <span className="font-semibold text-primary ml-1">
                              Rs {amountPerCustomer.toFixed(2)} each
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Selected:{" "}
                          {selectedCustomers.map((c) => c.name).join(", ")}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
                {customers
                  .filter(
                    (customer) =>
                      customer.name
                        .toLowerCase()
                        .includes(customerSearch.toLowerCase()) ||
                      (customer.phone &&
                        customer.phone.includes(customerSearch))
                  )
                  .map((customer) => (
                    <div
                      key={customer._id}
                      className={`cursor-pointer transition-all duration-200 rounded-lg border p-3 hover:shadow-sm ${
                        isCustomerSelected(customer)
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/20 hover:bg-muted/50"
                      }`}
                      onClick={() => toggleCustomerSelection(customer)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {customer.name}
                          </h4>
                          {customer.phone && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {customer.phone}
                            </p>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isCustomerSelected(customer)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isCustomerSelected(customer) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {customers.filter(
                  (customer) =>
                    customer.name
                      .toLowerCase()
                      .includes(customerSearch.toLowerCase()) ||
                    (customer.phone && customer.phone.includes(customerSearch))
                ).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No customers found</div>
                    <div className="text-xs mt-1">
                      Try adjusting your search terms
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomerSelectionOpen(false);
                setSelectedCustomers([]);
                setCustomerSearch("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomerAssignment}
              disabled={selectedCustomers.length === 0}
              className="min-w-[100px]"
            >
              {selectedCustomers.length === 0
                ? "Select Customers"
                : selectedCustomers.length === 1
                ? "Assign Bill"
                : `Split Bill (${selectedCustomers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog
        open={isTransactionDetailsOpen}
        onOpenChange={setIsTransactionDetailsOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Basic Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Transaction ID
                    </Label>
                    <p className="text-sm font-mono">
                      {selectedTransaction._id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Table
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedTransaction.table?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Customer
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedTransaction.customer?.name || "Walk-in"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedTransaction.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {selectedTransaction.status === "completed"
                          ? "Completed"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Total Amount
                    </Label>
                    <p className="text-lg font-bold">
                      Rs {selectedTransaction.total?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Created By
                    </Label>
                    <p className="text-sm">
                      {selectedTransaction.createdBy?.username || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Date & Time</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Created
                    </Label>
                    <p>
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedTransaction.updatedAt !==
                    selectedTransaction.createdAt && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Updated
                      </Label>
                      <p>
                        {new Date(
                          selectedTransaction.updatedAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Details */}
              {selectedTransaction.items &&
                selectedTransaction.items.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Inventory Items</h3>
                    <div className="space-y-3">
                      {selectedTransaction.items.map((item, index) => (
                        <div key={index} className="bg-muted/30 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-base">
                                {item.item?.name || "Item"}
                              </p>
                              <div className="text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-4">
                                  <span>Qty: {item.quantity}</span>
                                  <span>•</span>
                                  <span>
                                    Unit Price: Rs{" "}
                                    {item.priceAtTime?.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                Rs{" "}
                                {(
                                  (item.priceAtTime || 0) * item.quantity
                                ).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Line Total
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Items Total */}
                      <div className="flex justify-between items-center pt-3 border-t font-semibold">
                        <span>Items Subtotal:</span>
                        <span className="text-lg">
                          Rs{" "}
                          {selectedTransaction.items
                            .reduce(
                              (total, item) =>
                                total + (item.priceAtTime || 0) * item.quantity,
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Table Billing Details */}
              {selectedTransaction.customData && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Table Billing Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Game Type
                        </Label>
                        <p className="text-sm font-medium">
                          {selectedTransaction.customData.gameType}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Table Name
                        </Label>
                        <p className="text-sm font-medium">
                          {selectedTransaction.customData.tableName}
                        </p>
                      </div>
                    </div>

                    {selectedTransaction.customData.billing && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Session Duration
                          </Label>
                          <p className="text-sm font-medium">
                            {Math.floor(
                              selectedTransaction.customData.billing.duration /
                                60
                            )}
                            h{" "}
                            {selectedTransaction.customData.billing.duration %
                              60}
                            m
                          </p>
                        </div>

                        {/* Billing Breakdown */}
                        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                          <h4 className="font-medium text-sm">
                            Billing Breakdown
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Base Charge:</span>
                              <span>
                                Rs{" "}
                                {selectedTransaction.customData.billing.baseCharge?.toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            {selectedTransaction.customData.billing
                              .additionalPlayerCharge > 0 && (
                              <div className="flex justify-between">
                                <span>Additional Players:</span>
                                <span>
                                  Rs{" "}
                                  {selectedTransaction.customData.billing.additionalPlayerCharge?.toFixed(
                                    2
                                  )}
                                </span>
                              </div>
                            )}
                            {selectedTransaction.customData.billing
                              .additionalControllerCharge > 0 && (
                              <div className="flex justify-between">
                                <span>Additional Controllers:</span>
                                <span>
                                  Rs{" "}
                                  {selectedTransaction.customData.billing.additionalControllerCharge?.toFixed(
                                    2
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Split Bill Information */}
                        {selectedTransaction.customData.billing.splitBetween >
                          1 && (
                          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                              Split Bill Information
                            </h4>
                            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                              <div className="flex justify-between">
                                <span>Original Total:</span>
                                <span>
                                  Rs{" "}
                                  {selectedTransaction.customData.billing.originalTotal?.toFixed(
                                    2
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Split Between:</span>
                                <span>
                                  {
                                    selectedTransaction.customData.billing
                                      .splitBetween
                                  }{" "}
                                  customers
                                </span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Amount per Customer:</span>
                                <span>
                                  Rs {selectedTransaction.total?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Included Sales Information */}
                        {selectedTransaction.customData.includedSales &&
                          selectedTransaction.customData.includedSales.length >
                            0 && (
                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                              <h4 className="font-medium text-sm text-green-900 dark:text-green-100">
                                Included Sales
                              </h4>
                              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                                {selectedTransaction.customData.includedSales.map(
                                  (sale, index) => (
                                    <div key={sale.id} className="space-y-1">
                                      <div className="flex justify-between font-medium">
                                        <span>Sale #{index + 1}:</span>
                                        <span>Rs {sale.total.toFixed(2)}</span>
                                      </div>
                                      {sale.items.map((item, itemIndex) => (
                                        <div
                                          key={itemIndex}
                                          className="flex justify-between text-xs pl-2"
                                        >
                                          <span>
                                            {item.item?.name || "Item"} ×{" "}
                                            {item.quantity}
                                          </span>
                                          <span>
                                            Rs{" "}
                                            {(
                                              (item.priceAtTime || 0) *
                                              item.quantity
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                )}
                                {selectedTransaction.customData.salesTotal && (
                                  <div className="flex justify-between font-medium pt-2 border-t border-green-200 dark:border-green-800">
                                    <span>Total Sales:</span>
                                    <span>
                                      Rs{" "}
                                      {selectedTransaction.customData.salesTotal.toFixed(
                                        2
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTransactionDetailsOpen(false);
                setSelectedTransaction(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Sale Dialog */}
      <Dialog open={isRecordSaleOpen} onOpenChange={setIsRecordSaleOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Sale - {currentTable?.name}</DialogTitle>
            <DialogDescription>
              Add inventory items to this table's bill
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Current Sale Items */}
            {saleItems.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">
                  Current Sale ({saleItems.length} items)
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {saleItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rs {item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateSaleItemQuantity(
                                item._id,
                                item.quantity - 1
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateSaleItemQuantity(
                                item._id,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={() => removeSaleItem(item._id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Sale Total:</span>
                    <span className="font-bold text-lg">
                      Rs {calculateSaleTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Inventory Items */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Available Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {inventoryItems.length > 0 ? (
                  inventoryItems.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => addSaleItem(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Rs {item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            addSaleItem(item);
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <div className="text-sm">No inventory items available</div>
                    <div className="text-xs mt-1">
                      Add items in the inventory section first
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={fetchInventoryItems}
                    >
                      Refresh Items
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRecordSaleOpen(false);
                setSaleItems([]);
                setCurrentTable(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordSale}
              disabled={saleItems.length === 0}
              className="min-w-[120px]"
            >
              {saleItems.length === 0
                ? "Add Items"
                : `Record Sale (Rs ${calculateSaleTotal().toFixed(2)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Person Sale Dialog */}
      <Dialog
        open={isRecordPersonSaleOpen}
        onOpenChange={setIsRecordPersonSaleOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Person Sale</DialogTitle>
            <DialogDescription>
              Add inventory items for customer purchase (not linked to any
              table)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Customer Selection */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Select Customer</h3>
              <Select
                value={selectedPersonCustomer}
                onValueChange={setSelectedPersonCustomer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table Selection (Optional) */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Link to Table (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Link this sale to a table for proper admin attribution
              </p>
              <Select
                value={currentTable?._id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setCurrentTable(null);
                  } else {
                    const table = tables.find((t) => t._id === value);
                    setCurrentTable(table);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a table (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No table</SelectItem>
                  {tables
                    .filter((table) => table.status === "occupied")
                    .map((table) => (
                      <SelectItem key={table._id} value={table._id}>
                        {table.name}{" "}
                        {table.startedBy?.username &&
                          `(Started by: ${table.startedBy.username})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Sale Items */}
            {personSaleItems.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">
                  Current Sale ({personSaleItems.length} items)
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {personSaleItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rs {item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updatePersonSaleItemQuantity(
                                item._id,
                                item.quantity - 1
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updatePersonSaleItemQuantity(
                                item._id,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={() => removePersonSaleItem(item._id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Sale Total:</span>
                    <span className="font-bold text-lg">
                      Rs {calculatePersonSaleTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Inventory Items */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Available Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {inventoryItems.length > 0 ? (
                  inventoryItems.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => addPersonSaleItem(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Rs {item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            addPersonSaleItem(item);
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <div className="text-sm">No inventory items available</div>
                    <div className="text-xs mt-1">
                      Add items in the inventory section first
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={fetchInventoryItems}
                    >
                      Refresh Items
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRecordPersonSaleOpen(false);
                setPersonSaleItems([]);
                setSelectedPersonCustomer("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPersonSale}
              disabled={personSaleItems.length === 0 || !selectedPersonCustomer}
              className="min-w-[120px]"
            >
              {personSaleItems.length === 0
                ? "Add Items"
                : !selectedPersonCustomer
                ? "Select Customer"
                : `Record Sale (Rs ${calculatePersonSaleTotal().toFixed(2)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Person Dialog */}
      <Dialog
        open={isAddPersonDialogOpen}
        onOpenChange={setIsAddPersonDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Person to {currentTable?.name}</DialogTitle>
            <DialogDescription>
              Add additional players and controllers to this active table
              session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current table info */}
            {currentTable && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-sm font-medium">Current Session</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Players: {currentTable.additionalPlayers || 0} | Controllers:{" "}
                  {currentTable.additionalControllers || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Started:{" "}
                  {currentTable.startTime &&
                    new Date(currentTable.startTime).toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* Add players */}
            <div>
              <Label htmlFor="add-players">Additional Players</Label>
              <Input
                id="add-players"
                type="number"
                min="0"
                max="10"
                value={addPersonData.additionalPlayers}
                onChange={(e) =>
                  setAddPersonData({
                    ...addPersonData,
                    additionalPlayers: e.target.value,
                  })
                }
                placeholder="Number of players to add"
              />
            </div>

            {/* Add controllers */}
            <div>
              <Label htmlFor="add-controllers">Additional Controllers</Label>
              <Input
                id="add-controllers"
                type="number"
                min="0"
                max="10"
                value={addPersonData.additionalControllers}
                onChange={(e) =>
                  setAddPersonData({
                    ...addPersonData,
                    additionalControllers: e.target.value,
                  })
                }
                placeholder="Number of controllers to add"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPersonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPerson}
              disabled={
                (!addPersonData.additionalPlayers ||
                  addPersonData.additionalPlayers === "0") &&
                (!addPersonData.additionalControllers ||
                  addPersonData.additionalControllers === "0")
              }
            >
              Add to Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Dialog */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard {currentTable?.name}</DialogTitle>
            <DialogDescription>
              Cancel this table session without charging. Only available within
              first 10 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current session info */}
            {currentTable && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm font-medium text-orange-800">
                  Session Time: {calculateDuration(currentTable.startTime)}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Started:{" "}
                  {currentTable.startTime &&
                    new Date(currentTable.startTime).toLocaleTimeString()}
                </div>
                <div className="text-xs text-orange-600">
                  Time remaining to discard:{" "}
                  {Math.max(
                    0,
                    10 -
                      Math.floor(
                        (currentTime - new Date(currentTable.startTime)) /
                          (1000 * 60)
                      )
                  )}{" "}
                  minutes
                </div>
              </div>
            )}

            {/* Reason selection */}
            <div>
              <Label htmlFor="discard-reason">Reason for Discarding *</Label>
              <Select
                value={discardData.reason}
                onValueChange={(value) =>
                  setDiscardData({ ...discardData, reason: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">
                    Emergency - Customer had to leave
                  </SelectItem>
                  <SelectItem value="technical-issue">
                    Technical issue with equipment
                  </SelectItem>
                  <SelectItem value="customer-dissatisfied">
                    Customer didn't like the game/setup
                  </SelectItem>
                  <SelectItem value="power-outage">Power outage</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Optional note */}
            <div>
              <Label htmlFor="discard-note">Additional Note (Optional)</Label>
              <Input
                id="discard-note"
                placeholder="Any additional details..."
                value={discardData.note}
                onChange={(e) =>
                  setDiscardData({ ...discardData, note: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDiscardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDiscardTable}
              variant="destructive"
              disabled={!discardData.reason}
            >
              Discard Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record a business expense like repairs, advances, utilities, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Expense Title */}
            <div className="space-y-2">
              <Label htmlFor="expense-title">Expense Title *</Label>
              <Input
                id="expense-title"
                placeholder="e.g., Fan Repair, Advance Hassan, etc."
                value={expenseData.title}
                onChange={(e) =>
                  setExpenseData({ ...expenseData, title: e.target.value })
                }
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount (Rs) *</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={expenseData.amount}
                onChange={(e) =>
                  setExpenseData({ ...expenseData, amount: e.target.value })
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={expenseData.category}
                onValueChange={(value) =>
                  setExpenseData({ ...expenseData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Staff Advance">Staff Advance</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="expense-note">Note (Optional)</Label>
              <Input
                id="expense-note"
                placeholder="Additional details..."
                value={expenseData.note}
                onChange={(e) =>
                  setExpenseData({ ...expenseData, note: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddExpenseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={!expenseData.title.trim() || !expenseData.amount}
            >
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Sale Modification Dialog */}
      <Dialog
        open={isPendingSaleDialogOpen}
        onOpenChange={setIsPendingSaleDialogOpen}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review & Mark as Paid</DialogTitle>
            <DialogDescription>
              Review the sale items, remove returned items, or add additional
              items before marking as paid.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Transaction Info */}
            {pendingSaleTransaction && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold mb-2">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="ml-2 font-medium">
                      {pendingSaleTransaction.customer?.name ||
                        "Walk-in Customer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(
                        pendingSaleTransaction.createdAt
                      ).toLocaleString()}
                    </span>
                  </div>
                  {pendingSaleTransaction.tableId && (
                    <div>
                      <span className="text-muted-foreground">Linked to:</span>
                      <span className="ml-2 font-medium">
                        {pendingSaleTransaction.customData?.tableName ||
                          "Table"}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">
                      Original Total:
                    </span>
                    <span className="ml-2 font-medium">
                      Rs {pendingSaleTransaction.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Sale Items */}
            {pendingSaleItems.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">
                    Sale Items ({pendingSaleItems.length})
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    Click × to remove returned items
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pendingSaleItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background border rounded"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-medium">
                            Rs {((item.price || 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                updatePendingSaleItemQuantity(
                                  index,
                                  item.quantity - 1
                                )
                              }
                            >
                              -
                            </Button>
                            <span className="text-sm px-2 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                updatePendingSaleItemQuantity(
                                  index,
                                  item.quantity + 1
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            @ Rs {(item.price || 0).toFixed(2)} each
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0 ml-3"
                        onClick={() => removeItemFromPendingSale(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Current Total:</span>
                    <span className="font-bold text-lg">
                      Rs {calculatePendingSaleTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Inventory Items to Add */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Add Additional Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {inventoryItems.length > 0 ? (
                  inventoryItems.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => addItemToPendingSale(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Rs {item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            addItemToPendingSale(item);
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-muted-foreground">
                    <div className="text-sm">No inventory items available</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={fetchInventoryItems}
                    >
                      Refresh Items
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPendingSaleDialogOpen(false);
                setPendingSaleTransaction(null);
                setPendingSaleItems([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPendingSale}
              disabled={pendingSaleItems.length === 0}
              className="min-w-[140px]"
            >
              {pendingSaleItems.length === 0
                ? "No Items to Pay"
                : `Mark as Paid (Rs ${calculatePendingSaleTotal().toFixed(2)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Transfer Dialog */}
      <Dialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Bill Amount</DialogTitle>
            <DialogDescription>
              Split this bill by transferring a portion to another customer, or
              transfer the entire bill. Both customers will have separate
              pending bills (or the bill will be fully transferred).
            </DialogDescription>
          </DialogHeader>

          {transferTransaction && (
            <div className="space-y-4">
              {/* Original Bill Info */}
              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="text-sm font-medium mb-1">Original Bill</div>
                <div className="text-xs text-muted-foreground">
                  Customer: {transferTransaction.customer?.name || "Walk-in"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: Rs {transferTransaction.total?.toFixed(2)}
                </div>
              </div>

              {/* Transfer Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transferAmount">Amount to Transfer</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTransferData({
                        ...transferData,
                        amount: transferData.maxAmount,
                      })
                    }
                  >
                    Transfer All
                  </Button>
                </div>
                <Input
                  id="transferAmount"
                  type="number"
                  min="1"
                  max={transferData.maxAmount}
                  step="1"
                  value={transferData.amount || ""}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder={`Enter amount (Max: Rs${transferData.maxAmount.toFixed(
                    2
                  )})`}
                />
                {transferData.amount === transferData.maxAmount ? (
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Full bill transfer - original customer will have no
                    remaining balance
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Remaining on original customer: Rs
                    {(transferData.maxAmount - transferData.amount).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="transferCustomer">Transfer To Customer</Label>
                <Select
                  value={transferData.toCustomerId}
                  onValueChange={(value) =>
                    setTransferData({ ...transferData, toCustomerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter(
                        (c) => c._id !== transferTransaction.customer?._id
                      )
                      .map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                          {customer.phone && ` - ${customer.phone}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              {transferData.amount > 0 && transferData.toCustomerId && (
                <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-sm font-medium mb-2">
                    {transferData.amount === transferData.maxAmount
                      ? "After Full Transfer:"
                      : "After Transfer:"}
                  </div>
                  <div className="space-y-1 text-xs">
                    {transferData.amount === transferData.maxAmount ? (
                      <div className="text-orange-600 dark:text-orange-400 font-medium">
                        {
                          customers.find(
                            (c) => c._id === transferData.toCustomerId
                          )?.name
                        }
                        : Rs{transferData.amount.toFixed(2)} (Full Bill)
                      </div>
                    ) : (
                      <>
                        <div>
                          {transferTransaction.customer?.name ||
                            "Original Customer"}
                          : Rs
                          {(
                            transferData.maxAmount - transferData.amount
                          ).toFixed(2)}
                        </div>
                        <div>
                          {
                            customers.find(
                              (c) => c._id === transferData.toCustomerId
                            )?.name
                          }
                          : Rs{transferData.amount.toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsTransferDialogOpen(false);
                setTransferTransaction(null);
                setTransferData({ toCustomerId: "", amount: 0, maxAmount: 0 });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={
                !transferData.toCustomerId ||
                transferData.amount <= 0 ||
                transferData.amount > transferData.maxAmount
              }
            >
              {transferData.amount === transferData.maxAmount
                ? `Transfer All (Rs${transferData.amount.toFixed(2)})`
                : `Transfer Rs${transferData.amount.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TablesPage() {
  return (
    <ProtectedLayout>
      <TablesContent />
    </ProtectedLayout>
  );
}
