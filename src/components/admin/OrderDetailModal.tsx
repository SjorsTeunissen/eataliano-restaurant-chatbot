"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "./StatusBadge";
import type { Order } from "@/hooks/useRealtimeOrders";

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

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  isUpdating: boolean;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusChange,
  isUpdating,
}: OrderDetailModalProps) {
  if (!order) return null;

  const transitions = VALID_TRANSITIONS[order.status] || [];
  const availableTransitions = transitions.filter((t) => {
    if (t === "out_for_delivery" && order.order_type !== "delivery") return false;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bestelling #${order.id.slice(0, 8)}`}>
      <div className="space-y-4">
        {/* Customer info */}
        <div>
          <h3 className="text-sm font-body font-semibold text-oven/60 uppercase tracking-wide mb-2">
            Klantgegevens
          </h3>
          <div className="space-y-1 text-sm font-body">
            <p>
              <span className="text-oven/60">Naam:</span> {order.customer_name}
            </p>
            {order.customer_email && (
              <p>
                <span className="text-oven/60">E-mail:</span>{" "}
                {order.customer_email}
              </p>
            )}
            <p>
              <span className="text-oven/60">Telefoon:</span>{" "}
              {order.customer_phone}
            </p>
            <p>
              <span className="text-oven/60">Type:</span>{" "}
              {order.order_type === "pickup" ? "Afhalen" : "Bezorging"}
            </p>
            {order.delivery_address && (
              <p>
                <span className="text-oven/60">Adres:</span>{" "}
                {order.delivery_address}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-body text-oven/60">Status:</span>
          <StatusBadge status={order.status} type="order" />
          <span className="text-sm font-body text-oven/60 ml-2">Betaling:</span>
          <StatusBadge status={order.payment_status} type="payment" />
        </div>

        {/* Order items */}
        <div>
          <h3 className="text-sm font-body font-semibold text-oven/60 uppercase tracking-wide mb-2">
            Items
          </h3>
          <div className="border border-oven/8 rounded-base overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-oven/5">
                  <th className="text-left px-3 py-2 text-oven/60">Item</th>
                  <th className="text-right px-3 py-2 text-oven/60">Aantal</th>
                  <th className="text-right px-3 py-2 text-oven/60">Prijs</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.id} className="border-t border-oven/8">
                    <td className="px-3 py-2">
                      {item.item_name}
                      {item.special_instructions && (
                        <p className="text-xs text-oven/50 mt-0.5">
                          {item.special_instructions}
                        </p>
                      )}
                    </td>
                    <td className="text-right px-3 py-2">{item.quantity}x</td>
                    <td className="text-right px-3 py-2">
                      &euro;{(item.item_price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm font-body border-t border-oven/8 pt-3">
          <div className="flex justify-between">
            <span className="text-oven/60">Subtotaal</span>
            <span>&euro;{Number(order.subtotal).toFixed(2)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-oven/60">Bezorgkosten</span>
              <span>&euro;{Number(order.delivery_fee).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Totaal</span>
            <span>&euro;{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div>
            <h3 className="text-sm font-body font-semibold text-oven/60 uppercase tracking-wide mb-1">
              Opmerkingen
            </h3>
            <p className="text-sm font-body text-oven/80">{order.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs font-body text-oven/40">
          <p>
            Aangemaakt: {new Date(order.created_at).toLocaleString("nl-NL")}
          </p>
          <p>
            Bijgewerkt: {new Date(order.updated_at).toLocaleString("nl-NL")}
          </p>
        </div>

        {/* Status workflow buttons */}
        {availableTransitions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-oven/8">
            {availableTransitions.map((nextStatus) => (
              <Button
                key={nextStatus}
                size="sm"
                variant={nextStatus === "cancelled" ? "ghost" : "primary"}
                onClick={() => onStatusChange(order.id, nextStatus)}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                {TRANSITION_LABELS[nextStatus] || nextStatus}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
