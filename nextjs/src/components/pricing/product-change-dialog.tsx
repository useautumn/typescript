import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";

export interface ProductChangeDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  message: string;
  items?: {
    description: string;
    price: string;
  }[];
  options?: any;
  onClick: (options?: any) => void;
}
export default function ProductChangeDialog(params?: ProductChangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [optionsInput, setOptionsInput] = useState<
    {
      featureId: string;
      featureName: string;
      billingUnits: number;
      quantity?: number;
    }[]
  >(params?.options || []);

  useEffect(() => {
    setOptionsInput(params?.options || []);
  }, [params?.options]);

  if (!params) {
    return <></>;
  }

  const { open, setOpen, onClick, title, message, items } = params;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col gap-6 rounded-md overflow-hidden shadow-2xl bg-white w-md p-0">
        <DialogTitle className="font-bold text-xl px-6 pt-4">
          {title}
        </DialogTitle>
        <div className="text-muted-foreground px-6 my-0 text-sm whitespace-pre-line">
          {message}
        </div>
        {items && items.length > 0 && (
          <div className="text-foreground px-6 my-0 text-sm whitespace-pre-line">
            {items.map((item, index) => {
              const { description, price } = item;
              return (
                <div key={description} className="flex justify-between">
                  <div>{description}</div>
                  <div>{price}</div>
                </div>
              );
            })}
          </div>
        )}
        {optionsInput.length > 0 && (
          <div className="text-foreground px-6 my-0 text-sm whitespace-pre-line">
            {optionsInput.map((option, index) => {
              const { featureName, billingUnits, quantity } = option;
              return (
                <div key={featureName} className="flex items-center gap-3 mb-2">
                  <Input
                    type="number"
                    className="max-w-[100px] py-0 h-8"
                    value={quantity ? quantity / billingUnits : ""}
                    min={1}
                    onChange={(e) => {
                      const newOptions = [...optionsInput];
                      newOptions[index].quantity =
                        parseInt(e.target.value) * billingUnits;
                      setOptionsInput(newOptions);
                    }}
                  />
                  <span className="text-muted-foreground text-base">
                    × {billingUnits} words
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter className="flex justify-between border-t border-stone-200 bg-stone-100 py-3 px-6">
          <Button
            variant="outline"
            className="min-w-20"
            onClick={() => setOpen(false)}
            disabled={loading}
            type="button"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="font-medium shadow transition min-w-20"
            onClick={async () => {
              setLoading(true);
              try {
                await onClick(optionsInput);
              } catch (error) {
                console.error(error);
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
