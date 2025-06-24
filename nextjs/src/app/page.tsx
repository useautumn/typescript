"use client";

import React, { useEffect } from "react";
import { useAutumn, useCustomer, useEntity } from "autumn-js/react";
import AttachDialog from "@/components/autumn/attach-dialog";
import CheckDialog from "@/components/autumn/check-dialog";

const JSONWrapper = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="max-w-full text-xs overflow-y-scroll max-h-[350px] border border-zinc-100 p-2">
      <p>{label}</p>
      {children}
    </div>
  );
};

export default function Home() {
  const { attach, check, track, cancel, openBillingPortal } = useAutumn();
  const {
    customer,
    refetch,
    createEntity,
    createReferralCode,
    redeemReferralCode,
  } = useCustomer();

  useEffect(() => {
    const res = createReferralCode({
      programId: "test_program",
    }).then((res) => {
      console.log(res);
    });

    // console.log(res);

    // redeemReferralCode({
    //   code: "test_code",
    // });
    // createEntity({
    //   id: "test",
    //   name: "test",
    //   featureId: "seats",
    // });
  }, []);

  return (
    <React.Fragment>
      <div className="p-10">
        <JSONWrapper label="Customer">
          <pre>{JSON.stringify(customer, null, 2)}</pre>
        </JSONWrapper>
        {/* <JSONWrapper label="Entity">
          <pre>{JSON.stringify(entity, null, 2)}</pre>
        </JSONWrapper> */}

        <button
          onClick={async () => {
            const res = await createEntity({
              id: "test",
              name: "test",
              featureId: "seats",
            });
          }}
        >
          {" "}
          Create Entity
        </button>

        <button
          onClick={() => {
            check({
              featureId: "credits",
              dialog: CheckDialog,
            });
          }}
        >
          Check
        </button>
        <button
          onClick={() => {
            attach({
              productId: "pro",
              dialog: AttachDialog,
            });
          }}
        >
          Attach
        </button>
        <button
          onClick={async () => {
            await track({
              featureId: "credits",
              value: 2,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await refetch();
          }}
        >
          Track
        </button>
        <button
          onClick={async () => {
            await cancel({
              productId: "pro",
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await refetch();
          }}
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            await openBillingPortal({
              openInNewTab: true,
              returnUrl: "test",
            });
          }}
        >
          Open Billing Portal
        </button>
      </div>
      {/* <PricingTable /> */}
    </React.Fragment>
  );
}
