import mongoose from "mongoose";
import User from "./User";

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: [
        "Repair",
        "Maintenance",
        "Staff Advance",
        "Utilities",
        "Supplies",
        "Other",
      ],
      default: "Other",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
ExpenseSchema.index({ createdBy: 1 });
ExpenseSchema.index({ createdAt: -1 });
ExpenseSchema.index({ category: 1 });

// Prevent model recompilation in development
const Expense =
  mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);

export default Expense;
