"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import {
  LocationForm,
  OpeningHoursEditor,
  DeliveryZoneEditor,
} from "@/components/admin";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  delivery_zones: string[] | null;
  is_active: boolean;
}

export default function SettingsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    setLocations(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-white/60 rounded-base" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-32 bg-white/60 rounded-base" />
            <div className="h-64 bg-white/60 rounded-base" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-headline text-2xl text-oven mb-6">Instellingen</h1>

      <div className="space-y-8">
        {locations.map((location) => (
          <Card key={location.id} className="p-6">
            <h2 className="font-headline text-xl text-oven mb-4">
              {location.name}
            </h2>

            <div className="space-y-6">
              {/* Location details */}
              <section>
                <h3 className="font-headline text-lg text-oven mb-3">
                  Locatiegegevens
                </h3>
                <LocationForm
                  location={location}
                  onSaved={fetchLocations}
                />
              </section>

              <hr className="border-oven/10" />

              {/* Opening hours */}
              <section>
                <h3 className="font-headline text-lg text-oven mb-3">
                  Openingstijden
                </h3>
                <OpeningHoursEditor
                  locationId={location.id}
                  openingHours={location.opening_hours}
                  onSaved={fetchLocations}
                />
              </section>

              <hr className="border-oven/10" />

              {/* Delivery zones */}
              <section>
                <h3 className="font-headline text-lg text-oven mb-3">
                  Bezorggebieden
                </h3>
                <DeliveryZoneEditor
                  locationId={location.id}
                  deliveryZones={location.delivery_zones ?? []}
                  onSaved={fetchLocations}
                />
              </section>
            </div>
          </Card>
        ))}

        {locations.length === 0 && (
          <p className="text-sm text-oven/40 font-body text-center py-8">
            Geen locaties gevonden
          </p>
        )}
      </div>
    </div>
  );
}
