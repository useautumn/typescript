import { useAutumn } from "autumn-js/next";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

import { Autumn } from "autumn-js";

export default function Application() {
  const { check, track, refetch } = useAutumn();

  const sendMessageClicked = async (featureId: string) => {
    const res = await check({
      featureId,
    });

    if (!res.allowed) {
      toast.error(`You're out of ${featureId}!`);
      return;
    }

    await track({
      featureId,
    });

    await refetch();

    toast.success(`${featureId} used!`);
  };

  return (
    <div className="border border-gray-800 rounded-lg bg-zinc-900 overflow-hidden flex flex-col">
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Feature Access Example
            </h2>
            <p className="text-sm text-gray-400">
              Test how our feature access and event sending works
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#7ED4AF]/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-[#7ED4AF]" />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">
        <div className="space-y-2">
          <div className="text-sm font-medium text-white">How it works:</div>
          <ol className="text-sm space-y-2 text-gray-400 list-decimal list-inside">
            <li>First calls /entitled to check message allowance</li>
            <li>If allowed, calls /events to record the message</li>
            <li>Updates remaining message count</li>
          </ol>
        </div>
      </div>

      <div className="p-6 pt-0 flex gap-2">
        <Button
          className="w-full border-1 rounded-md border-[#0E8454] hover:border-[#48C890] bg-[#006239] hover:bg-[#2C7B57] text-white transition-colors"
          onClick={async () => {
            await sendMessageClicked("chat-messages");
          }}
        >
          Use Chat Message
        </Button>
      </div>
    </div>
  );
}
