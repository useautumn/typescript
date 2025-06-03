import { useAutumn, useCustomer, useEntity } from "autumn-js/next";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useState } from "react";

export default function Application() {
  // const featureId = "chat-messages";
  const featureId = "credits";
  const { check, track, attach, cancel } = useAutumn();

  const { refetch, createEntity } = useCustomer();

  const sendMessageClicked = async (featureId: string) => {
    const { data, error } = await check({
      featureId,
    });

    if (error) {
      return;
    }

    if (!data.allowed) {
      return;
    }

    const res2 = await track({
      eventName: "act",
      idempotencyKey: "chat-message-sent",
    });

    console.log(res2);

    // await refetch();

    toast.success(`${featureId} used!`);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
      {entity && <pre>{JSON.stringify(entity, null, 2)}</pre>}
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
