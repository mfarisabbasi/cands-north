import mongoose from "mongoose";

const StockMovementSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    type: {
      type: String,
      enum: ["stock_in", "stock_out", "adjustment", "sale"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    reference: {
      type: String, // Reference to transaction ID or other reference
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
StockMovementSchema.index({ item: 1, createdAt: -1 });
StockMovementSchema.index({ type: 1 });
StockMovementSchema.index({ updatedBy: 1 });

export default mongoose.models.StockMovement ||
  mongoose.model("StockMovement", StockMovementSchema);
