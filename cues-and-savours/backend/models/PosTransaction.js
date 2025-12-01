import mongoose from "mongoose";

const PosTransactionSchema = new mongoose.Schema(
  {
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: function () {
            return this.items && this.items.length > 0;
          },
        },
        quantity: {
          type: Number,
          required: function () {
            return this.items && this.items.length > 0;
          },
          min: 0.01, // Allow decimal quantities for bill splitting
        },
        priceAtTime: {
          type: Number,
          required: function () {
            return this.items && this.items.length > 0;
          },
        },
      },
    ],
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      // Not required as it's optional
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      // Not required as it's optional
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customData: {
      type: mongoose.Schema.Types.Mixed,
      // For storing table billing details or other custom transaction data
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PosTransaction ||
  mongoose.model("PosTransaction", PosTransactionSchema);
