"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ImpactCharts({
  visits,
  harvest,
  categories,
  members,
  labels,
}: {
  visits: { month: string; visits: number }[];
  harvest: { month: string; pounds: number }[];
  categories: { category: string; count: number }[];
  members: { month: string; count: number }[];
  labels: { visits: string; harvest: string; categories: string; members: string };
}) {
  const blocks = [
    [labels.visits, visits, "visits"],
    [labels.harvest, harvest, "pounds"],
    [labels.categories, categories, "count"],
    [labels.members, members, "count"],
  ] as const;
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {blocks.map(([title, data, key]) => (
        <figure key={title} className="rounded-3xl border border-line bg-card p-4">
          <figcaption className="font-semibold">{title}</figcaption>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data]}>
                <XAxis dataKey={key === "count" && "category" in (data[0] ?? {}) ? "category" : "month"} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey={key} fill="#215c45" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      ))}
    </div>
  );
}
