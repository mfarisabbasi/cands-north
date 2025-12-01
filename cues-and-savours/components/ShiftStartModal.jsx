"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Play } from "lucide-react";
import useAuthStore from "@/lib/store/useAuthStore";
import { toast } from "sonner";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export function ShiftStartModal({ isOpen, onClose }) {
  const { startShift, shiftLoading } = useAuthStore();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartShift = async () => {
    setIsStarting(true);
    try {
      const result = await startShift();

      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to start shift");
    } finally {
      setIsStarting(false);
    }
  };

  const currentTime = dayjs()
    .tz("Asia/Karachi")
    .format("DD-MM-YYYY | hh:mm A (PST)");

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Start Your Shift
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You must start your shift to access the system.
            </p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Time (PST)</p>
              <p className="text-lg font-mono">{currentTime}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleStartShift}
              disabled={isStarting || shiftLoading}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {isStarting || shiftLoading ? "Starting Shift..." : "Start Shift"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
