"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CheckoutDialog, useCustomer } from "autumn-js/react";

export default function TestButtons() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const { data: orgs } = authClient.useListOrganizations();
  // const { refetch: refetchEntity } = useEntity(
  //   "test_" + (session?.session.activeOrganizationId ?? "default")
  // );

  const {
    attach,
    cancel,
    check,
    track,
    checkout,
    openBillingPortal,
    createReferralCode,
    redeemReferralCode,
    createEntity,
    refetch: refetchCustomer,
  } = useCustomer();

  const handleAddMember = async () => {
    const res = await authClient.organization.inviteMember({
      organizationId: orgs?.find((org) => org.name === "Test Organization")?.id,
      email: "johnyeocx@gmail.com",
      role: "admin",
      resend: true,
    });

    console.log(res);
  };

  const handleRemoveMember = async () => {
    const res = await authClient.organization.removeMember({
      organizationId: orgs?.find((org) => org.name === "Test Organization")?.id,
      memberIdOrEmail: "johnyeocx@gmail.com",
    });
    console.log(res);
  };

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold">All Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={async () => {
            const res = await fetch("http://localhost:3001/api/test", {
              method: "GET",
            });
            console.log(res);
          }}
        >
          Test Better Auth Plugin
        </Button>
        <Button
          onClick={async () => {
            const res = await handleAddMember();
            console.log(res);
          }}
        >
          Test Add Auth Member
        </Button>
        <Button
          onClick={async () => {
            const res = await handleRemoveMember();
            console.log(res);
          }}
        >
          Test Remove Auth Member
        </Button>

        <Button
          onClick={async () => {
            const res = await authClient.organization.setActive({
              organizationId: orgs?.find(
                (org) => org.name === "Test Organization"
              )?.id,
            });
            refetchSession();
            refetchCustomer();
            console.log(res);
          }}
        >
          Set Active Organization 1
        </Button>
        <Button
          onClick={async () => {
            const res = await authClient.organization.setActive({
              organizationId: orgs?.find(
                (org) => org.name === "Test Organization 2"
              )?.id,
            });
            refetchSession();
            refetchCustomer();
            console.log(res);
          }}
        >
          Set Active Organization 2
        </Button>
        <Button
          onClick={async () => {
            const res = await fetch(
              "http://localhost:3001/api/test/deleteAllOrgs",
              {
                method: "GET",
              }
            );
            const data = await res.json();
            refetchSession();
            console.log(data);
          }}
        >
          Delete All Orgs
        </Button>

        {/* Entities */}
        <Button
          onClick={async () => {
            const res = await createEntity({
              id: `test_${session?.session.activeOrganizationId ?? "default"}`,
              name: "Test Entity",
              featureId: "test",
            });
            console.log(res);
            refetchCustomer();
          }}
        >
          Create Entity
        </Button>
        <Button
          onClick={async () => {
            // const entity = useEntity("test");
            // console.log(entity.entity);
          }}
        >
          Get Entity
        </Button>
        <Button
          onClick={async () => {
            // const entity = useEntity("test");
          }}
        >
          Delete Entity
        </Button>

        {/* Billing & Features */}
        <Button
          onClick={async () => {
            const res = await openBillingPortal({
              // openInNewTab: true,
              returnUrl: "https://facebook.com",
              openInNewTab: true,
            });
            console.log(res);
          }}
        >
          Open Billing Portal
        </Button>
        <Button
          onClick={async () => {
            const res = await cancel({
              productId: "pro",
              cancelImmediately: true,
            });
            console.log(res);
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={async () => {
            const res = await check({
              featureId: "messages",
            });
            console.log(res);
          }}
        >
          Check
        </Button>
        <Button
          onClick={async () => {
            const res = await track({
              featureId: "messages",
            });
            console.log(res);
          }}
        >
          Track
        </Button>
        <Button
          onClick={async () => {
            const res = await checkout({
              productId: "pro",
              successUrl: "https://facebook.com",
              openInNewTab: true,
              dialog: CheckoutDialog,
              checkoutSessionParams: {
                subscription_data: {
                  metadata: {
                    heyThere: "test",
                  },
                },
              },
            });
            console.log(res);
          }}
        >
          Checkout
        </Button>
        <Button
          onClick={async () => {
            const res = await attach({
              productId: "ecoinvent_monthly",
              openInNewTab: true,
            });
            console.log(res);
          }}
        >
          Attach
        </Button>
        <Button
          onClick={async () => {
            const res = await createReferralCode({
              programId: "test",
            });
            console.log(res);
          }}
        >
          Create Referral Code
        </Button>
        <Button
          onClick={async () => {
            const res = await redeemReferralCode({
              code: "XCA1I1",
            });
            console.log(res);
          }}
        >
          Redeem Referral Code
        </Button>
      </div>
    </section>
  );
}
