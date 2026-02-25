"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "./StatusBadge";
import { useRealtimeReservations } from "@/hooks/useRealtimeReservations";
import type { Reservation } from "@/hooks/useRealtimeReservations";

const STATUS_FILTERS = [
  { value: "", label: "Alle" },
  { value: "confirmed", label: "Bevestigd" },
  { value: "completed", label: "Afgerond" },
  { value: "no_show", label: "Niet verschenen" },
  { value: "cancelled", label: "Geannuleerd" },
];

const RESERVATION_ACTIONS: Record<
  string,
  { nextStatus: string; label: string; variant: "primary" | "secondary" | "ghost" }[]
> = {
  confirmed: [
    { nextStatus: "completed", label: "Afgerond", variant: "primary" },
    { nextStatus: "no_show", label: "Niet verschenen", variant: "secondary" },
    { nextStatus: "cancelled", label: "Annuleren", variant: "ghost" },
  ],
};

function getTodayString() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Amsterdam",
  });
}

export function ReservationList() {
  const [dateFilter, setDateFilter] = useState(getTodayString());
  const [statusFilter, setStatusFilter] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { reservations, isLoading, error, refetch } =
    useRealtimeReservations({
      date_from: dateFilter || undefined,
      date_to: dateFilter || undefined,
      status: statusFilter || undefined,
    });

  async function handleStatusChange(
    reservationId: string,
    newStatus: string
  ) {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update mislukt");
      }

      refetch();
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Onbekende fout"
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // Group reservations by date
  function groupByDate(items: Reservation[]) {
    const groups: Record<string, Reservation[]> = {};
    for (const r of items) {
      if (!groups[r.reservation_date]) {
        groups[r.reservation_date] = [];
      }
      groups[r.reservation_date].push(r);
    }
    return groups;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-oven/50 font-body">Reserveringen laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500 font-body">{error}</div>
      </div>
    );
  }

  const grouped = groupByDate(reservations);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Input
            label="Datum"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 text-sm font-body rounded-full transition-colors ${
                statusFilter === value
                  ? "bg-fiamma text-white"
                  : "bg-white text-oven/70 hover:bg-oven/5 border border-oven/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Update error message */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body rounded-base px-4 py-2">
          {updateError}
        </div>
      )}

      {/* Empty state */}
      {reservations.length === 0 && (
        <div className="text-center py-12 text-oven/50 font-body">
          Geen reserveringen gevonden
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h3 className="font-body font-medium text-oven/60 mb-2">
              {new Date(date + "T00:00:00").toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="bg-white border border-oven/8 rounded-base shadow-warm-sm overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-oven/5 border-b border-oven/8">
                    <th className="text-left px-4 py-3 text-oven/60 font-medium">
                      Klant
                    </th>
                    <th className="text-left px-4 py-3 text-oven/60 font-medium">
                      Telefoon
                    </th>
                    <th className="text-right px-4 py-3 text-oven/60 font-medium">
                      Personen
                    </th>
                    <th className="text-left px-4 py-3 text-oven/60 font-medium">
                      Tijd
                    </th>
                    <th className="text-left px-4 py-3 text-oven/60 font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-oven/60 font-medium">
                      Bron
                    </th>
                    <th className="text-right px-4 py-3 text-oven/60 font-medium">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="border-t border-oven/8 hover:bg-oven/2"
                    >
                      <td className="px-4 py-3">
                        {reservation.customer_name}
                        {reservation.notes && (
                          <p className="text-xs text-oven/40 mt-0.5">
                            {reservation.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {reservation.customer_phone}
                      </td>
                      <td className="text-right px-4 py-3">
                        {reservation.party_size}
                      </td>
                      <td className="px-4 py-3">
                        {reservation.reservation_time}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={reservation.status}
                          type="reservation"
                        />
                      </td>
                      <td className="px-4 py-3 text-oven/50 text-xs capitalize">
                        {reservation.created_via}
                      </td>
                      <td className="text-right px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {(RESERVATION_ACTIONS[reservation.status] || []).map(
                            ({ nextStatus, label, variant }) => (
                              <Button
                                key={nextStatus}
                                size="sm"
                                variant={variant}
                                onClick={() =>
                                  handleStatusChange(
                                    reservation.id,
                                    nextStatus
                                  )
                                }
                                disabled={isUpdating}
                              >
                                {label}
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-body font-medium text-oven">
                {reservation.customer_name}
              </span>
              <StatusBadge
                status={reservation.status}
                type="reservation"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-oven/60 mb-2">
              <span>{reservation.reservation_time}</span>
              <span>{reservation.party_size} personen</span>
              <span className="capitalize">{reservation.created_via}</span>
            </div>
            <div className="text-sm text-oven/50 mb-1">
              {reservation.customer_phone}
            </div>
            {reservation.notes && (
              <p className="text-xs text-oven/40 mb-2">
                {reservation.notes}
              </p>
            )}
            <div className="text-xs text-oven/40 mb-2">
              {new Date(
                reservation.reservation_date + "T00:00:00"
              ).toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            {(RESERVATION_ACTIONS[reservation.status] || []).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-oven/8">
                {(RESERVATION_ACTIONS[reservation.status] || []).map(
                  ({ nextStatus, label, variant }) => (
                    <Button
                      key={nextStatus}
                      size="sm"
                      variant={variant}
                      onClick={() =>
                        handleStatusChange(reservation.id, nextStatus)
                      }
                      disabled={isUpdating}
                    >
                      {label}
                    </Button>
                  )
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
