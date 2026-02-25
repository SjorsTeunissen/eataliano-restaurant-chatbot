"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "./StatusBadge";
import { OrderDetailModal } from "./OrderDetailModal";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import type { Order } from "@/hooks/useRealtimeOrders";

const STATUS_FILTERS = [
  { value: "", label: "Alle" },
  { value: "pending", label: "In afwachting" },
  { value: "confirmed", label: "Bevestigd" },
  { value: "preparing", label: "In bereiding" },
  { value: "ready", label: "Klaar" },
  { value: "out_for_delivery", label: "Onderweg" },
  { value: "completed", label: "Afgerond" },
  { value: "cancelled", label: "Geannuleerd" },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "out_for_delivery", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const TRANSITION_LABELS: Record<string, string> = {
  confirmed: "Bevestigen",
  preparing: "In bereiding",
  ready: "Klaar",
  completed: "Afgerond",
  out_for_delivery: "Bezorgen",
  cancelled: "Annuleren",
};

export function OrderList() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { orders, isLoading, error, refetch } = useRealtimeOrders(
    statusFilter ? { status: statusFilter } : undefined
  );

  async function handleStatusChange(orderId: string, newStatus: string) {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update mislukt");
      }

      // Close modal if the updated order was selected
      if (selectedOrder?.id === orderId) {
        const updatedOrder = await res.json();
        setSelectedOrder(updatedOrder);
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

  function getAvailableTransitions(order: Order) {
    const transitions = VALID_TRANSITIONS[order.status] || [];
    return transitions.filter((t) => {
      if (t === "out_for_delivery" && order.order_type !== "delivery")
        return false;
      return true;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-oven/50 font-body">Bestellingen laden...</div>
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

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
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

      {/* Update error message */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body rounded-base px-4 py-2">
          {updateError}
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="text-center py-12 text-oven/50 font-body">
          Geen bestellingen gevonden
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        {orders.length > 0 && (
          <div className="bg-white border border-oven/8 rounded-base shadow-warm-sm overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-oven/5 border-b border-oven/8">
                  <th className="text-left px-4 py-3 text-oven/60 font-medium">
                    Bestelling
                  </th>
                  <th className="text-left px-4 py-3 text-oven/60 font-medium">
                    Klant
                  </th>
                  <th className="text-left px-4 py-3 text-oven/60 font-medium">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 text-oven/60 font-medium">
                    Items
                  </th>
                  <th className="text-right px-4 py-3 text-oven/60 font-medium">
                    Totaal
                  </th>
                  <th className="text-left px-4 py-3 text-oven/60 font-medium">
                    Betaling
                  </th>
                  <th className="text-left px-4 py-3 text-oven/60 font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-oven/60 font-medium">
                    Tijd
                  </th>
                  <th className="text-right px-4 py-3 text-oven/60 font-medium">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-oven/8 hover:bg-oven/2 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">{order.customer_name}</td>
                    <td className="px-4 py-3">
                      {order.order_type === "pickup" ? "Afhalen" : "Bezorging"}
                    </td>
                    <td className="text-right px-4 py-3">
                      {order.order_items.length}
                    </td>
                    <td className="text-right px-4 py-3">
                      &euro;{Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={order.payment_status}
                        type="payment"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} type="order" />
                    </td>
                    <td className="px-4 py-3 text-oven/50 text-xs">
                      {new Date(order.created_at).toLocaleString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </td>
                    <td className="text-right px-4 py-3">
                      <div
                        className="flex gap-1 justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getAvailableTransitions(order)
                          .filter((t) => t !== "cancelled")
                          .slice(0, 1)
                          .map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                handleStatusChange(order.id, nextStatus)
                              }
                              disabled={isUpdating}
                            >
                              {TRANSITION_LABELS[nextStatus]}
                            </Button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-oven/50">
                #{order.id.slice(0, 8)}
              </span>
              <StatusBadge status={order.status} type="order" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-body font-medium text-oven">
                {order.customer_name}
              </span>
              <span className="font-body text-sm">
                &euro;{Number(order.total).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-oven/50 mb-3">
              <span>
                {order.order_type === "pickup" ? "Afhalen" : "Bezorging"} &middot;{" "}
                {order.order_items.length} items
              </span>
              <StatusBadge status={order.payment_status} type="payment" />
            </div>
            {getAvailableTransitions(order).length > 0 && (
              <div
                className="flex flex-wrap gap-2 pt-2 border-t border-oven/8"
                onClick={(e) => e.stopPropagation()}
              >
                {getAvailableTransitions(order).map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    size="sm"
                    variant={nextStatus === "cancelled" ? "ghost" : "primary"}
                    onClick={() =>
                      handleStatusChange(order.id, nextStatus)
                    }
                    disabled={isUpdating}
                  >
                    {TRANSITION_LABELS[nextStatus]}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Order detail modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />
    </div>
  );
}
