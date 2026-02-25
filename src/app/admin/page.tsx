"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CalendarDays,
  UtensilsCrossed,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { StatCard } from "@/components/admin";

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  reservationsToday: number;
  menuItems: number;
  categories: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      // Get today's date in Amsterdam timezone
      const now = new Date();
      const amsterdamDate = now.toLocaleDateString("en-CA", {
        timeZone: "Europe/Amsterdam",
      });
      const todayStart = `${amsterdamDate}T00:00:00`;
      const todayEnd = `${amsterdamDate}T23:59:59`;

      const [ordersRes, reservationsRes, menuRes, categoriesRes] =
        await Promise.all([
          supabase
            .from("orders")
            .select("total_amount")
            .gte("created_at", todayStart)
            .lte("created_at", todayEnd),
          supabase
            .from("reservations")
            .select("id")
            .gte("date", amsterdamDate)
            .lte("date", amsterdamDate),
          supabase
            .from("menu_items")
            .select("id")
            .eq("is_available", true),
          supabase
            .from("menu_categories")
            .select("id")
            .eq("is_active", true),
        ]);

      const orders = ordersRes.data ?? [];
      const revenue = orders.reduce(
        (sum, o) => sum + (Number(o.total_amount) || 0),
        0
      );

      setStats({
        ordersToday: orders.length,
        revenueToday: revenue,
        reservationsToday: reservationsRes.data?.length ?? 0,
        menuItems: menuRes.data?.length ?? 0,
        categories: categoriesRes.data?.length ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const formatEur = (amount: number) =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-2xl text-oven">Dashboard</h1>
        <Link href="/admin/menu">
          <Button size="sm">Beheer Menu</Button>
        </Link>
      </div>

      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          data-testid="dashboard-loading"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white/60 rounded-base animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Bestellingen Vandaag"
            value={stats?.ordersToday ?? 0}
            subtitle={formatEur(stats?.revenueToday ?? 0)}
            icon={<ShoppingBag size={24} />}
          />
          <StatCard
            title="Reserveringen Vandaag"
            value={stats?.reservationsToday ?? 0}
            icon={<CalendarDays size={24} />}
          />
          <StatCard
            title="Menu Items"
            value={stats?.menuItems ?? 0}
            icon={<UtensilsCrossed size={24} />}
          />
          <StatCard
            title="Categorieen"
            value={stats?.categories ?? 0}
            icon={<Layers size={24} />}
          />
        </div>
      )}
    </div>
  );
}
