"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function TestBetterAuth() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const { data: orgs } = authClient.useListOrganizations();

  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedOrgId && orgs && orgs.length > 0) {
      setSelectedOrgId(orgs[0].id);
    }
  }, [orgs, selectedOrgId]);

  const activeOrg = React.useMemo(() => {
    const id = session?.session.activeOrganizationId ?? null;
    if (!id) return null;
    return orgs?.find((o) => o.id === id) ?? null;
  }, [session, orgs]);

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Quick actions for Better Auth testing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Sign-in actions */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Sign-in
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={async () => {
                  const res = await authClient.signIn.email({
                    email: "johnyeo10@gmail.com",
                    password: "testing123",
                  });
                  console.log(res);
                }}
              >
                Sign In
              </Button>
              <Button
                onClick={async () => {
                  const res = await authClient.signOut();
                  console.log(res);
                }}
              >
                Sign Out
              </Button>
              <Button
                onClick={async () => {
                  const res = await authClient.signUp.email({
                    name: "John Yeo",
                    email: "johnyeo10@gmail.com",
                    password: "testing123",
                  });
                  console.log(res);
                }}
              >
                Sign Up
              </Button>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Organizations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                Organizations
              </div>
              <div className="text-xs text-muted-foreground">
                Active:{" "}
                {activeOrg ? (
                  <span className="font-medium">{activeOrg.name}</span>
                ) : (
                  <span className="italic">None</span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  const res = await authClient.organization.create({
                    name: "Test Organization",
                    slug: `test-organization-${Date.now()}`,
                  });
                  console.log(res);
                }}
                className="w-full"
              >
                Create Organization
              </Button>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Select organization
                  </label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    value={selectedOrgId ?? ""}
                    onChange={(e) => setSelectedOrgId(e.target.value || null)}
                  >
                    <option value="">Choose…</option>
                    {orgs?.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={async () => {
                    const res = await authClient.organization.setActive({
                      organizationId: selectedOrgId ?? null,
                    });
                    await refetchSession();
                    console.log(res);
                  }}
                  disabled={!selectedOrgId}
                  className="self-end"
                >
                  Set Active
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const res = await authClient.organization.setActive({
                      organizationId: null,
                    });
                    await refetchSession();
                    console.log(res);
                  }}
                  className="self-end"
                >
                  Clear Active
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
