import mongoose from "mongoose";

const RemainingSchema = new mongoose.Schema(
  {
    remainingBalance: {
      type: Number,
      required: true,
      min: [0, "Remaining balance cannot be negative"],
    },
    remainingOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCleared: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Remaining =
  mongoose.models.Remaining || mongoose.model("Remaining", RemainingSchema);

export default Remaining;
