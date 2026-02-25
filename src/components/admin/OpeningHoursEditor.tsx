"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

type DayName =
  | "maandag"
  | "dinsdag"
  | "woensdag"
  | "donderdag"
  | "vrijdag"
  | "zaterdag"
  | "zondag";

type OpeningHours = Record<DayName, DayHours>;

const DAYS: { key: DayName; label: string }[] = [
  { key: "maandag", label: "Maandag" },
  { key: "dinsdag", label: "Dinsdag" },
  { key: "woensdag", label: "Woensdag" },
  { key: "donderdag", label: "Donderdag" },
  { key: "vrijdag", label: "Vrijdag" },
  { key: "zaterdag", label: "Zaterdag" },
  { key: "zondag", label: "Zondag" },
];

interface OpeningHoursEditorProps {
  locationId: string;
  openingHours: Record<string, DayHours>;
  onSaved: () => void;
}

export function OpeningHoursEditor({
  locationId,
  openingHours,
  onSaved,
}: OpeningHoursEditorProps) {
  const [hours, setHours] = useState<OpeningHours>(() => {
    const initial = {} as OpeningHours;
    for (const { key } of DAYS) {
      initial[key] = {
        open: openingHours[key]?.open ?? "16:00",
        close: openingHours[key]?.close ?? "22:00",
        closed: openingHours[key]?.closed ?? false,
      };
    }
    return initial;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function updateDay(day: DayName, field: keyof DayHours, value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const { key } of DAYS) {
      const day = hours[key];
      if (!day.closed && day.open >= day.close) {
        newErrors[key] = "Sluitingstijd moet na openingstijd liggen";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("locations")
        .update({ opening_hours: hours })
        .eq("id", locationId);

      if (error) throw error;

      setSuccess(true);
      onSaved();
    } catch (err) {
      setErrors({
        form:
          err instanceof Error ? err.message : "Er ging iets mis bij het opslaan",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const timeInputClasses =
    "rounded-base border border-oven/20 px-3 py-2 text-base font-body text-oven focus:outline-none focus:ring-2 focus:border-fiamma focus:ring-fiamma/20 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-3">
        {DAYS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-28 text-sm font-body font-medium text-oven shrink-0">
                {label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[key].open}
                  onChange={(e) => updateDay(key, "open", e.target.value)}
                  disabled={hours[key].closed}
                  className={timeInputClasses}
                  aria-label={`${label} openingstijd`}
                />
                <span className="text-oven/60">&ndash;</span>
                <input
                  type="time"
                  value={hours[key].close}
                  onChange={(e) => updateDay(key, "close", e.target.value)}
                  disabled={hours[key].closed}
                  className={timeInputClasses}
                  aria-label={`${label} sluitingstijd`}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-body text-oven">
                <input
                  type="checkbox"
                  checked={hours[key].closed ?? false}
                  onChange={(e) => updateDay(key, "closed", e.target.checked)}
                  className="rounded"
                />
                Gesloten
              </label>
            </div>
            {errors[key] && (
              <p className="text-sm text-red-500 mt-1 sm:ml-28" role="alert">
                {errors[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      {errors.form && (
        <p className="text-sm text-red-500" role="alert">
          {errors.form}
        </p>
      )}

      {success && (
        <p className="text-sm text-basilico">
          Openingstijden succesvol opgeslagen
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          Opslaan
        </Button>
      </div>
    </form>
  );
}
