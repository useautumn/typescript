"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAutumn } from "autumn-js/next";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [orgData, setOrgData] = useState({
    name: "",
    slug: "",
  });

  const { customer, attach, openBillingPortal } = useAutumn();

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authClient.organization.create(orgData);
      setIsOpen(false);
      setOrgData({ name: "", slug: "" });
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  const { data: org } = authClient.useActiveOrganization();
  const handleLeaveOrg = async () => {
    try {
      if (!org?.id) {
        throw new Error("No organization ID found");
      }
      await authClient.organization.delete({
        organizationId: org?.id,
      });
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Failed to leave organization:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Better Auth Demo</h1>
      <p className="text-gray-600 text-center max-w-md mb-8">
        This is a demo of Better Auth integration with Next.js
      </p>
      <div className="flex flex-col gap-2 mb-8">
        <p>Customer ID: {customer?.id}</p>
        <p>Customer Email: {customer?.email}</p>
        <p>Customer Name: {customer?.name}</p>
      </div>
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => attach({ productId: "pro-example" })}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Upgrade to Pro
        </button>
        <button
          onClick={() => openBillingPortal()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Manage Billing
        </button>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Create Organization
        </Button>
        <Button
          onClick={handleLeaveOrg}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Leave Organization
        </Button>
      </div>

      <button
        onClick={async () => {
          await authClient.signOut();
          router.push("/auth");
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Sign Out
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={orgData.name}
                onChange={(e) =>
                  setOrgData({ ...orgData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Organization Slug</Label>
              <Input
                id="slug"
                value={orgData.slug}
                onChange={(e) =>
                  setOrgData({ ...orgData, slug: e.target.value })
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
