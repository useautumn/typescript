import { useAutumn, useCustomer } from "autumn-js/next";
import { Cone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function Application() {
  const featureId = "chat-messages";
  const { check, track } = useAutumn();
  const { refetch } = useCustomer();

  const sendMessageClicked = async (featureId: string) => {
    const res = await check({
      featureId,
    });

    if (!res.allowed) {
      return;
    }

    const trackRes = await track({
      featureId,
    });

    await refetch();

    toast.success(`${featureId} used!`);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Feature Access Example
            </h2>
            <p className="text-sm text-gray-500">
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
          <div className="text-sm font-medium text-gray-900">How it works:</div>
          <ol className="text-sm space-y-2 text-gray-500 list-decimal list-inside">
            <li>First calls /entitled to check message allowance</li>
            <li>If allowed, calls /events to record the message</li>
            <li>Updates remaining message count</li>
          </ol>
        </div>
      </div>

      <div className="p-6 pt-0 flex gap-2">
        <Button
          variant="main"
          onClick={async () => {
            await sendMessageClicked(featureId);
          }}
        >
          Use Chat Message
        </Button>
      </div>
    </div>
  );
}
