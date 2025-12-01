import mongoose from "mongoose";

const ShiftSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    duration: {
      type: Number, // Duration in minutes
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ShiftSchema.index({ admin: 1, status: 1 });
ShiftSchema.index({ startTime: -1 });

// Virtual for formatted duration
ShiftSchema.virtual("formattedDuration").get(function () {
  if (!this.duration) return null;

  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
});

// Ensure virtual fields are serialized
ShiftSchema.set("toJSON", { virtuals: true });
ShiftSchema.set("toObject", { virtuals: true });

// Prevent model recompilation in development
const Shift = mongoose.models.Shift || mongoose.model("Shift", ShiftSchema);

export default Shift;
