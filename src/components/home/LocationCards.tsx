import { MapPin, Phone, Clock } from "lucide-react";
import { Card } from "@/components/ui";

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  opening_hours: Record<string, { open: string; close: string }>;
}

const DUTCH_DAYS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
] as const;

function getTodayHours(
  openingHours: Record<string, { open: string; close: string }>
): { open: string; close: string } | null {
  const dayName = DUTCH_DAYS[new Date().getDay()];
  return openingHours[dayName] ?? null;
}

export function LocationCards({ locations }: { locations: Location[] }) {
  return (
    <section className="bg-crema py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="font-headline text-3xl text-oven md:text-4xl">
          Onze Locaties
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {locations.map((location) => {
            const todayHours = getTodayHours(location.opening_hours);
            return (
              <Card key={location.id}>
                <h3 className="font-headline text-2xl text-fiamma">
                  {location.name}
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 shrink-0 text-fiamma"
                      size={18}
                    />
                    <span className="font-body text-sm text-oven/80">
                      {location.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="shrink-0 text-fiamma" size={18} />
                    <span className="font-body text-sm text-oven/80">
                      {location.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="shrink-0 text-fiamma" size={18} />
                    <span className="font-body text-sm text-oven/80">
                      {todayHours
                        ? `Vandaag: ${todayHours.open} - ${todayHours.close}`
                        : "Vandaag: Gesloten"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
