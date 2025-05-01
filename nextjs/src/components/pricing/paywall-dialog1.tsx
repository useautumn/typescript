"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";

export interface PaywallDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
  onClick: () => void;
  buttonText?: string;
}
export default function PaywallDialog(params?: PaywallDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!params) {
    return <></>;
  }

  const { open, setOpen, message, onClick, buttonText } = params;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col gap-6 rounded-md overflow-hidden shadow-2xl bg-white w-md p-0">
        <DialogTitle className="font-bold text-xl px-6 pt-4">
          Feature Unavailable
        </DialogTitle>
        <div className="text-muted-foreground px-6 my-0 text-sm">{message}</div>
        <DialogFooter className="flex justify-between border-t border-stone-200 bg-stone-100 py-3 px-6">
          <Button
            size="sm"
            className="font-medium shadow transition min-w-20"
            onClick={async () => {
              setLoading(true);
              try {
                await onClick();
              } catch (error) {
                console.error(error);
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {buttonText || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
