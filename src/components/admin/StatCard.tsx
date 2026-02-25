"use client";

import { Card } from "@/components/ui";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div className="text-fiamma">{icon}</div>
      <div>
        <p className="font-headline text-2xl text-oven">{value}</p>
        <p className="text-sm text-oven/60 font-body">{title}</p>
        {subtitle && <p className="text-xs text-oven/40">{subtitle}</p>}
      </div>
    </Card>
  );
}
