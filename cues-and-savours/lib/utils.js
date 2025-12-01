import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import qz from "qz-tray";

qz.api.setPromiseType((resolver) => new Promise(resolver));
qz.api.setSha256Type((data) => data); // disable signing for testing

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const connectPrinter = async () => {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect().catch((err) => {
      console.error("Error connecting to QZ Tray:", err);
    });
  }
};

export const disconnectPrinter = async () => {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }
};

export const printReceipt = async (transaction) => {
  try {
    await connectPrinter();

    const config = qz.configs.create("BlackCopper 80mm Series(1)");

    // Extract transaction details
    const tableName = transaction.table?.name || "Walk-in";
    const customerName = transaction.customer?.name || "Walk-in Customer";
    const createdBy = transaction.createdBy?.username || "Staff";
    const date = new Date(transaction.createdAt || new Date()).toLocaleString(
      "en-PK",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
    const transactionId = transaction._id?.toString().slice(-8) || "N/A";

    // Helper function to format line with left and right alignment (48 chars for 80mm)
    const formatLine = (left, right, width = 48) => {
      const rightStr = String(right);
      const leftStr = String(left);
      const spaces = width - leftStr.length - rightStr.length;
      return leftStr + " ".repeat(Math.max(1, spaces)) + rightStr;
    };

    // Build receipt sections
    let receiptBody = "";
    let tableBillingCharge = 0;
    let salesTotal = 0;

    // Check for table billing in customData
    if (transaction.customData?.billing) {
      const billing = transaction.customData.billing;
      tableBillingCharge = billing.totalCharge || 0;

      receiptBody += "TABLE BILLING\n";
      receiptBody +=
        formatLine(transaction.customData.tableName || tableName, "") + "\n";
      receiptBody +=
        formatLine("  Duration:", billing.duration || "N/A") + "\n";
      receiptBody +=
        formatLine("  Game Type:", transaction.customData.gameType || "N/A") +
        "\n";
      receiptBody +=
        formatLine("  Table Charge", `Rs ${tableBillingCharge.toFixed(2)}`) +
        "\n";
      receiptBody += "================================\n";
    }

    // Add inventory items
    if (transaction.items && transaction.items.length > 0) {
      receiptBody += "ITEMS\n";
      transaction.items.forEach((item) => {
        const itemName = item.item?.name || "Item";
        const quantity = item.quantity || 1;
        const price = item.priceAtTime || 0;
        const lineTotal = quantity * price;
        salesTotal += lineTotal;

        // Item name and quantity
        receiptBody += formatLine(`${itemName} x${quantity}`, "") + "\n";
        // Unit price and line total
        receiptBody +=
          formatLine(
            `  @ Rs ${price.toFixed(2)}`,
            `Rs ${lineTotal.toFixed(2)}`
          ) + "\n";
      });
      receiptBody += "================================\n";
    }

    // Calculate totals
    const total = transaction.total || tableBillingCharge + salesTotal;

    const CUT_PAPER = "\x1B\x69";
    const FEED = "\n\n\n\n";

    const receipt = `
================================
      CUES & SAVOURS
================================
${formatLine("Date:", date)}
${formatLine("Receipt #:", transactionId)}
${formatLine("Cashier:", createdBy)}
${formatLine("Customer:", customerName)}
${formatLine("Table:", tableName)}
================================
${receiptBody}${
      tableBillingCharge > 0 && salesTotal > 0
        ? formatLine("Table Billing:", `Rs ${tableBillingCharge.toFixed(2)}`) +
          "\n" +
          formatLine("Items Total:", `Rs ${salesTotal.toFixed(2)}`) +
          "\n" +
          "--------------------------------\n"
        : ""
    }${formatLine("TOTAL:", `Rs ${total.toFixed(2)}`)}
================================
     Thank you for visiting!
        Cues & Savours
================================
${FEED}${CUT_PAPER}
`;

    await qz.print(config, [{ type: "raw", format: "plain", data: receipt }]);
    console.log("Print successful");
    return true;
  } catch (error) {
    console.error("Print failed:", error);
    return false;
  } finally {
    setTimeout(() => disconnectPrinter(), 2000);
  }
};
