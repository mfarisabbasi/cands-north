import mongoose from "mongoose";

const GameTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Game type name is required"],
      trim: true,
    },
    chargeType: {
      type: String,
      required: [true, "Charge type is required"],
      enum: ["Per Minute", "Per Half Hour", "Per Hour", "Flexible"],
    },
    chargeAmount: {
      type: Number,
      required: function() {
        return this.chargeType !== "Flexible";
      },
      min: [0, "Charge amount cannot be negative"],
    },
    // New fields for flexible pricing
    flexiblePricing: {
      halfHourRate: {
        type: Number,
        required: function() {
          return this.chargeType === "Flexible";
        },
        min: [0, "Half hour rate cannot be negative"],
      },
      hourRate: {
        type: Number,
        required: function() {
          return this.chargeType === "Flexible";
        },
        min: [0, "Hour rate cannot be negative"],
      },
      thresholdMinutes: {
        type: Number,
        default: 40,
        min: [1, "Threshold must be at least 1 minute"],
        max: [60, "Threshold cannot exceed 60 minutes"],
      },
    },
    includedControllers: {
      type: Number,
      default: 0,
      min: [0, "Included controllers cannot be negative"],
    },
    includedPlayers: {
      type: Number,
      default: 0,
      min: [0, "Included players cannot be negative"],
    },
    additionalPersonCharge: {
      type: Number,
      default: 0,
      min: [0, "Additional person charge cannot be negative"],
    },
    additionalControllerCharge: {
      type: Number,
      default: 0,
      min: [0, "Additional controller charge cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const GameType =
  mongoose.models.GameType || mongoose.model("GameType", GameTypeSchema);

export default GameType;
