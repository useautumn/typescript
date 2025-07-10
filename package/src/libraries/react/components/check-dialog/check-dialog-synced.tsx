"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckContent } from "./lib/check-content";
import { cn } from "@/lib/utils";
import { type CheckFeaturePreview } from "@sdk";

export interface CheckDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  preview: CheckFeaturePreview;
}

export default function CheckDialog(params?: CheckDialogProps) {
  const [loading] = useState(false);

  if (!params || !params.preview) {
    return <></>;
  }

  const { open, setOpen } = params;
  const { products } = params.preview;
  const { title, message } = getCheckContent(params.preview);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="au-p-0 au-pt-4 au-gap-0 au-text-foreground au-overflow-hidden au-text-sm">
        <DialogTitle className={cn("au-font-bold au-text-xl au-px-6")}>
          {title}
        </DialogTitle>
        <div className="au-px-6 au-my-2">{message}</div>
        <DialogFooter className="au-flex au-flex-col sm:au-flex-row au-justify-between au-gap-x-4 au-py-2 au-mt-4 au-pl-6 au-pr-3 au-bg-secondary au-border-t">
          <Button
            size="sm"
            className="au-font-medium au-shadow au-transition au-min-w-20"
            onClick={async () => {
              setOpen(false);
            }}
          >
            {loading && (
              <Loader2 className="au-w-4 au-h-4 au-mr-2 au-animate-spin" />
            )}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
