"use client";

import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Badge, Input } from "@/components/ui";

interface DeliveryZoneEditorProps {
  locationId: string;
  deliveryZones: string[];
  onSaved: () => void;
}

export function DeliveryZoneEditor({
  locationId,
  deliveryZones,
  onSaved,
}: DeliveryZoneEditorProps) {
  const [zones, setZones] = useState<string[]>(deliveryZones ?? []);
  const [newZone, setNewZone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleAdd() {
    const trimmed = newZone.trim();
    if (!trimmed) return;
    if (zones.includes(trimmed)) {
      setError("Dit postcode gebied is al toegevoegd");
      return;
    }
    setZones((prev) => [...prev, trimmed]);
    setNewZone("");
    setError("");
    setSuccess(false);
  }

  function handleRemove(zone: string) {
    setZones((prev) => prev.filter((z) => z !== zone));
    setSuccess(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("locations")
        .update({ delivery_zones: zones })
        .eq("id", locationId);

      if (dbError) throw dbError;

      setSuccess(true);
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Er ging iets mis bij het opslaan"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => (
            <Badge key={zone} className="flex items-center gap-1.5 pr-1.5">
              {zone}
              <button
                type="button"
                onClick={() => handleRemove(zone)}
                className="text-fiamma/60 hover:text-fiamma transition-colors"
                aria-label={`Verwijder ${zone}`}
              >
                <X size={14} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Postcode toevoegen..."
            value={newZone}
            onChange={(e) => {
              setNewZone(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleAdd}>
          Toevoegen
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-basilico">
          Bezorggebieden succesvol opgeslagen
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
