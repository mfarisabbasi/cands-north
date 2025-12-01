import { create } from "zustand";
import { persist } from "zustand/middleware";

const useRecordedSalesStore = create(
  persist(
    (set, get) => ({
      // Store recorded sales by table ID
      recordedSales: {},

      // Add a sale to a specific table
      addSaleToTable: (tableId, saleData) => {
        const { recordedSales } = get();
        const currentSales = recordedSales[tableId] || [];

        const newSale = {
          id: Date.now() + Math.random(), // Temporary ID
          items: saleData.items,
          total: saleData.total,
          createdAt: new Date().toISOString(),
        };

        set({
          recordedSales: {
            ...recordedSales,
            [tableId]: [...currentSales, newSale],
          },
        });
      },

      // Get all sales for a specific table
      getSalesForTable: (tableId) => {
        const { recordedSales } = get();
        return recordedSales[tableId] || [];
      },

      // Get total amount for all sales of a table
      getTotalForTable: (tableId) => {
        const sales = get().getSalesForTable(tableId);
        return sales.reduce((total, sale) => total + sale.total, 0);
      },

      // Clear sales for a specific table (after table is turned off)
      clearSalesForTable: (tableId) => {
        const { recordedSales } = get();
        const updatedSales = { ...recordedSales };
        delete updatedSales[tableId];

        set({
          recordedSales: updatedSales,
        });
      },

      // Remove a specific sale from a table
      removeSaleFromTable: (tableId, saleId) => {
        const { recordedSales } = get();
        const currentSales = recordedSales[tableId] || [];

        set({
          recordedSales: {
            ...recordedSales,
            [tableId]: currentSales.filter((sale) => sale.id !== saleId),
          },
        });
      },

      // Update a specific sale in a table
      updateSaleInTable: (tableId, saleId, updatedSaleData) => {
        const { recordedSales } = get();
        const currentSales = recordedSales[tableId] || [];

        set({
          recordedSales: {
            ...recordedSales,
            [tableId]: currentSales.map((sale) =>
              sale.id === saleId
                ? {
                    ...sale,
                    ...updatedSaleData,
                    updatedAt: new Date().toISOString(),
                  }
                : sale
            ),
          },
        });
      },

      // Remove an individual item from a sale
      removeItemFromSale: (tableId, saleId, itemIndex) => {
        const { recordedSales } = get();
        const currentSales = recordedSales[tableId] || [];

        set({
          recordedSales: {
            ...recordedSales,
            [tableId]: currentSales
              .map((sale) => {
                if (sale.id === saleId) {
                  const updatedItems = sale.items.filter(
                    (_, index) => index !== itemIndex
                  );
                  const newTotal = updatedItems.reduce(
                    (total, item) =>
                      total + (item.priceAtTime || 0) * item.quantity,
                    0
                  );

                  return {
                    ...sale,
                    items: updatedItems,
                    total: newTotal,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return sale;
              })
              .filter((sale) => sale.items.length > 0), // Remove sales with no items
          },
        });
      },

      // Update quantity of an individual item in a sale
      updateItemQuantityInSale: (tableId, saleId, itemIndex, newQuantity) => {
        const { recordedSales } = get();
        const currentSales = recordedSales[tableId] || [];

        set({
          recordedSales: {
            ...recordedSales,
            [tableId]: currentSales
              .map((sale) => {
                if (sale.id === saleId) {
                  const updatedItems = sale.items.map((item, index) =>
                    index === itemIndex
                      ? { ...item, quantity: newQuantity }
                      : item
                  );
                  const newTotal = updatedItems.reduce(
                    (total, item) =>
                      total + (item.priceAtTime || 0) * item.quantity,
                    0
                  );

                  return {
                    ...sale,
                    items: updatedItems,
                    total: newTotal,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return sale;
              })
              .filter((sale) => sale.items.length > 0), // Remove sales with no items
          },
        });
      },

      // Clear all recorded sales (useful for debugging)
      clearAllSales: () => {
        set({ recordedSales: {} });
      },
    }),
    {
      name: "recorded-sales-storage",
      // Only persist the recordedSales object
      partialize: (state) => ({ recordedSales: state.recordedSales }),
    }
  )
);

export default useRecordedSalesStore;
