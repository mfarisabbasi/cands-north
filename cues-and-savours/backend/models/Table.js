import mongoose from "mongoose";
import GameType from "./GameType";
import Customer from "./Customer";
import User from "./User";

const TableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Table name is required"],
      trim: true,
    },
    gameType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameType",
      required: [true, "Game type is required"],
    },
    status: {
      type: String,
      enum: ["on", "off"],
      default: "off",
    },
    currentCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    totalCharge: {
      type: Number,
      default: 0,
      min: [0, "Total charge cannot be negative"],
    },
    additionalPlayers: {
      type: Number,
      default: 0,
      min: [0, "Additional players cannot be negative"],
    },
    additionalControllers: {
      type: Number,
      default: 0,
      min: [0, "Additional controllers cannot be negative"],
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const Table = mongoose.models.Table || mongoose.model("Table", TableSchema);

export default Table;
