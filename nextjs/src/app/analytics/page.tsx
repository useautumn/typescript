"use client";

import { useAnalytics, useCustomer } from "autumn-js/react";
import { AnalyticsChart, MetricCard } from "@/components/analytics";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export default function AnalyticsPage() {
  const { track } = useCustomer();
  const { data, isLoading, error } = useAnalytics({
    featureId: ["sonnet-3-5", "sonnet-4", "opus-4"],
    range: "30d"
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading analytics: {error.message}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No analytics data available</div>
      </div>
    );
  }

  // Calculate totals from data
  const totalTokensIn = data.reduce((sum, item) => 
    sum + (Number(item["sonnet-3-5"]) || 0) + (Number(item["sonnet-4"]) || 0) + (Number(item["opus-4"]) || 0), 0
  );

  const handleAskOpus4 = async () => {
    const result = await track({
      featureId: "opus-4",
      value: 10000000,
    });
    console.log(result);
  };


  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <Topbar />
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard title="Total tokens in" value={totalTokensIn} />
          <div className="flex justify-end gap-2 flex-col">
            <p>Ask opus a question (costs 10M tokens)</p>
            <div className="flex items-end gap-2">
            <Input />
            <Button className="text-md" onClick={handleAskOpus4}>Ask</Button>
            </div>
          </div>
        </div>
        
        <AnalyticsChart 
          data={data}
          title="Token usage"
          description="Includes usage from both API and Console"
        />
      </div>
    </div>
  );
}