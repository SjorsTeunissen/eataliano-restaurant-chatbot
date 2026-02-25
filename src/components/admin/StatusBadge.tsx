"use client";

import { Badge } from "@/components/ui/Badge";
import type { BadgeProps } from "@/components/ui/Badge";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const ORDER_STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  pending: { variant: "warning", label: "In afwachting" },
  confirmed: { variant: "default", label: "Bevestigd" },
  preparing: { variant: "default", label: "In bereiding" },
  ready: { variant: "success", label: "Klaar" },
  out_for_delivery: { variant: "default", label: "Onderweg" },
  completed: { variant: "success", label: "Afgerond" },
  cancelled: { variant: "error", label: "Geannuleerd" },
};

const RESERVATION_STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  confirmed: { variant: "success", label: "Bevestigd" },
  cancelled: { variant: "error", label: "Geannuleerd" },
  completed: { variant: "success", label: "Afgerond" },
  no_show: { variant: "warning", label: "Niet verschenen" },
};

const PAYMENT_STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  pending: { variant: "warning", label: "Niet betaald" },
  paid: { variant: "success", label: "Betaald" },
  failed: { variant: "error", label: "Mislukt" },
  refunded: { variant: "warning", label: "Terugbetaald" },
};

interface StatusBadgeProps {
  status: string;
  type: "order" | "reservation" | "payment";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const map =
    type === "order"
      ? ORDER_STATUS_MAP
      : type === "reservation"
        ? RESERVATION_STATUS_MAP
        : PAYMENT_STATUS_MAP;

  const entry = map[status] || { variant: "default" as BadgeVariant, label: status };

  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}
