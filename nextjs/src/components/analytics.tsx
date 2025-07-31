"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-6">
        <div className="text-sm text-gray-600 mb-2">{title}</div>
        <div className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  );
}

export function FilterButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}>
      {children}
      <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

interface UsageData {
  period: string | number;
  [key: string]: string | number;
}

interface AnalyticsChartProps {
  data: UsageData[];
  title?: string;
  description?: string;
}

const chartConfig = {
  "sonnet-3-5": {
    label: "Claude 3.5 Sonnet",
    color: "#ef4444",
  },
  "sonnet-4": {
    label: "Claude 4 Sonnet", 
    color: "#3b82f6",
  },
  "opus-4": {
    label: "Claude 4 Opus",
    color: "#a855f7",
  },
} satisfies ChartConfig;

function formatPeriod(timestamp: string | number): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function filterDataPoints(data: any[], maxPoints: number = 15) {
  // Show all data points instead of filtering
  return data;
}

export function formatTokens(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function AnalyticsChart({ data, title = "Token Usage", description = "Token usage by model over time" }: AnalyticsChartProps) {
  const allChartData = data.map(item => ({
    date: formatPeriod(item.period),
    "sonnet-3-5": Number(item["sonnet-3-5"]) || 0,
    "sonnet-4": Number(item["sonnet-4"]) || 0, 
    "opus-4": Number(item["opus-4"]) || 0,
  }));
  
  const chartData = filterDataPoints(allChartData);

  const totalTokens = data.reduce((sum, item) => 
    sum + (Number(item["sonnet-3-5"]) || 0) + (Number(item["sonnet-4"]) || 0) + (Number(item["opus-4"]) || 0), 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} &quot; Total: {formatTokens(totalTokens)} tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[500px] w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatTokens}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-gray-900 mb-2">{`Date: ${label}`}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-gray-700">
                            {formatTokens(Number(entry.value))} {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label || entry.dataKey}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="sonnet-3-5"
              stackId="tokens"
              fill="#ef4444"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="sonnet-4"
              stackId="tokens"
              fill="#3b82f6"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="opus-4"
              stackId="tokens"
              fill="#a855f7"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}