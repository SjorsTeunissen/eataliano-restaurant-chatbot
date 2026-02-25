"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useRef } from "react";

export interface Reservation {
  id: string;
  location_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  created_via: "chatbot" | "admin";
  created_at: string;
  updated_at: string;
}

interface Filters {
  location_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export function useRealtimeReservations(filters?: Filters) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchReservations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtersRef.current?.location_id)
        params.set("location_id", filtersRef.current.location_id);
      if (filtersRef.current?.date_from)
        params.set("date_from", filtersRef.current.date_from);
      if (filtersRef.current?.date_to)
        params.set("date_to", filtersRef.current.date_to);
      if (filtersRef.current?.status)
        params.set("status", filtersRef.current.status);

      const res = await fetch(`/api/reservations?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch reservations");
      }
      const data = await res.json();
      setReservations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();

    const supabase = createClient();
    const channel = supabase
      .channel("reservations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchReservations();
          } else if (payload.eventType === "UPDATE") {
            setReservations((prev) =>
              prev.map((r) =>
                r.id === (payload.new as Reservation).id
                  ? { ...r, ...(payload.new as Partial<Reservation>) }
                  : r
              )
            );
          } else if (payload.eventType === "DELETE") {
            setReservations((prev) =>
              prev.filter(
                (r) => r.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations]);

  // Refetch when filters change
  useEffect(() => {
    fetchReservations();
  }, [
    filters?.location_id,
    filters?.date_from,
    filters?.date_to,
    filters?.status,
    fetchReservations,
  ]);

  return { reservations, isLoading, error, refetch: fetchReservations };
}
