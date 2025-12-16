"use client";
import { PricingTable, useCustomer, useListEvents, useAggregateEvents } from "autumn-js/react";

import { authClient } from "@/lib/auth-client";
import { TestBetterAuth } from "@/components/test-better-auth";
import { CustomerDataViewer } from "@/components/customer-data-viewer";
import { EventLogViewer } from "@/components/event-log-viewer";
import { EventAggregateViewer } from "@/components/event-aggregate-viewer";
import TestButtons from "@/components/test-buttons";

export default function Home() {
  const {
    data: session,
    refetch: refetchSession,
    isPending,
  } = authClient.useSession();

  const { data: organisation } = authClient.useActiveOrganization();
  const { data: orgs } = authClient.useListOrganizations();

  const { customer } = useCustomer({ expand: ["invoices"] });

  // Event hooks - only fetch if customer exists
  const { list: eventLogs, isLoading: eventsLoading } = useListEvents({
    customer_id: customer?.id ?? "",
    feature_id: "invoice_bug",
  });

  const { list: aggregateList, total: aggregateTotal, isLoading: aggregateLoading } = useAggregateEvents({
    customer_id: customer?.id ?? "",
    feature_id: "invoice_bug",
    group_by: "properties.random_word_key",
    bin_size: "day",
    range: "7d",
  });

  if (isPending) return <div>Loading...</div>;
  else
    return (
      <div className="min-h-screen w-screen flex">
        <div className="flex-1 min-h-screen overflow-y-auto p-10 space-y-8">
          <h2 className="text-2xl font-bold">Actions & Pricing</h2>

          <PricingTable />
          <TestBetterAuth />
          <TestButtons />
        </div>

        {/* Right Column - Data Display */}
        <div className="flex-1 min-h-screen overflow-y-auto p-10 space-y-6 gap-y-4">
          <h2 className="text-2xl font-bold">Data</h2>

          {session && (
            <details className="p-4 rounded-lg">
              <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
                Session
              </summary>
              <div className="space-y-1 mt-4">
                <p>
                  <span className="font-medium">User ID:</span>{" "}
                  {session.user.id}
                </p>
                <p>
                  <span className="font-medium">Name:</span> {session.user.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {session.user.email}
                </p>
                <p>
                  <span className="font-medium">Session ID:</span>{" "}
                  {session.session.id}
                </p>
                {session.session.activeOrganizationId && (
                  <p>
                    <span className="font-medium">Active Org ID:</span>{" "}
                    {session.session.activeOrganizationId}
                  </p>
                )}
              </div>
            </details>
          )}

          {organisation && (
            <details className="p-4 rounded-lg py-8">
              <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
                Active Organization
              </summary>
              <div className="space-y-1 mt-4">
                <p>
                  <span className="font-medium">ID:</span> {organisation.id}
                </p>
                <p>
                  <span className="font-medium">Name:</span> {organisation.name}
                </p>
                <p>
                  <span className="font-medium">Slug:</span> {organisation.slug}
                </p>
              </div>
            </details>
          )}

          {orgs && (
            <details className="p-4 rounded-lg">
              <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
                Organizations ({orgs.length})
              </summary>
              <div className="space-y-2 mt-4">
                {orgs.map((org) => (
                  <div key={org.id} className="border-b pb-2">
                    <p>
                      <span className="font-medium">ID:</span> {org.id}
                    </p>
                    <p>
                      <span className="font-medium">Name:</span> {org.name}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {customer && <CustomerDataViewer customer={customer} />}

          {eventLogs && eventLogs.length > 0 && (
            <EventLogViewer events={eventLogs} />
          )}

          {aggregateList && aggregateTotal && (
            <EventAggregateViewer data={{ list: aggregateList, total: aggregateTotal }} />
          )}

          {/* {entity && (
            <details className="p-4 rounded-lg">
              <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
                Entity
              </summary>
              <div className="space-y-1 mt-4">
                <p>
                  <span className="font-medium">ID:</span> {entity.id}
                </p>
                <p>
                  <span className="font-medium">Name:</span> {entity.name}
                </p>
              </div>
            </details>
          )} */}
        </div>
      </div>
    );
}
