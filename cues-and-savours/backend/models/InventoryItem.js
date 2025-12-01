import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },
    isStockManaged: {
      type: Boolean,
      default: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, "Threshold cannot be negative"],
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
  }
);

// Add index for faster search queries
inventoryItemSchema.index({ name: "text" });

// Prevent model recompilation in development
const InventoryItem =
  mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", inventoryItemSchema);

export default InventoryItem;
