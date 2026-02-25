"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useRef } from "react";

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  special_instructions: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  location_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  order_type: "pickup" | "delivery";
  delivery_address: string | null;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "completed"
    | "cancelled";
  subtotal: number;
  delivery_fee: number;
  total: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  estimated_ready_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

interface Filters {
  location_id?: string;
  status?: string;
}

export function useRealtimeOrders(filters?: Filters) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtersRef.current?.location_id)
        params.set("location_id", filtersRef.current.location_id);
      if (filtersRef.current?.status)
        params.set("status", filtersRef.current.status);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const supabase = createClient();
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchOrders();
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === (payload.new as Order).id
                  ? { ...o, ...(payload.new as Partial<Order>) }
                  : o
              )
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) =>
              prev.filter(
                (o) => o.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Refetch when filters change
  useEffect(() => {
    fetchOrders();
  }, [filters?.location_id, filters?.status, fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}
