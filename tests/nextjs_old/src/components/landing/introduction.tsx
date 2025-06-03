import { useAutumn, useEntity } from "autumn-js/next";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Intro({
  number,
  // entityId = "1",
  params,
}: {
  number: number;
  // entityId: string;
  params?: any;
}) {
  const { track } = useAutumn();
  const [entityId, setEntityId] = useState<any>("1");
  const { entity, isLoading, refetch } = useEntity(entityId, params);

  useEffect(() => {
    console.log("Entity changed:", entity);
  }, [entity]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => {
          if (entityId === "1") {
            console.log("Changing to 3");
            setEntityId("3");
          } else {
            console.log("Changing to 1");
            setEntityId("1");
          }
        }}
      >
        Toggle ID
      </button>
      <div>Entity ID: {entityId}</div>
      <pre className="text-xs">{JSON.stringify(entity, null, 2)}</pre>
      <p>useEntity {number} ⬆️</p>
      <button
        onClick={async () => {
          await track({
            featureId: "credits",
            value: 100,
          });
          await refetch();
        }}
      >
        Track
      </button>
    </div>
  );
}
