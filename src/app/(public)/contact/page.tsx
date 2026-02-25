import type { Metadata } from "next";
import { MapPin, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Contact — Eataliano",
  description:
    "Bezoek Eataliano in Arnhem of Huissen. Bekijk onze adressen, telefoonnummers en openingstijden.",
};

const DAY_ORDER = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
] as const;

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface OpeningHours {
  [day: string]: { open: string; close: string };
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  opening_hours: OpeningHours;
  is_active: boolean;
}

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <section className="bg-oven py-16 text-crema">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h1 className="font-headline text-4xl font-bold uppercase tracking-wide md:text-5xl">
            Contact
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-crema/80">
            Bezoek ons of neem contact op
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {!locations || locations.length === 0 ? (
            <p className="text-center text-oven/50">
              Er zijn momenteel geen locaties beschikbaar.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {(locations as Location[]).map((location) => (
                <Card key={location.id} className="p-6">
                  <h2 className="font-headline text-2xl font-semibold text-fiamma">
                    {location.name}
                  </h2>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-fiamma" />
                      <span>{location.address}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 shrink-0 text-fiamma" />
                      <a
                        href={`tel:${location.phone}`}
                        className="text-fiamma hover:underline"
                      >
                        {location.phone}
                      </a>
                    </div>

                    {location.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 shrink-0 text-fiamma" />
                        <a
                          href={`mailto:${location.email}`}
                          className="text-fiamma hover:underline"
                        >
                          {location.email}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="font-headline text-lg font-semibold text-oven">
                      Openingstijden
                    </h3>
                    <dl className="mt-3 space-y-1">
                      {DAY_ORDER.map((day) => {
                        const hours = location.opening_hours[day];
                        return (
                          <div
                            key={day}
                            className="flex justify-between text-sm"
                          >
                            <dt className="font-medium">
                              {capitalize(day)}
                            </dt>
                            <dd className="text-oven/70">
                              {hours
                                ? `${hours.open} - ${hours.close}`
                                : "Gesloten"}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>

                  <div className="mt-6 flex h-48 items-center justify-center rounded-base bg-oven/5">
                    <div className="text-center text-oven/40">
                      <MapPin className="mx-auto h-8 w-8" />
                      <p className="mt-2 text-sm">
                        Kaart binnenkort beschikbaar
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-oven/5 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h2 className="font-headline text-3xl font-semibold text-oven">
            Neem Contact Op
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-oven/70">
            Heb je vragen, opmerkingen of wil je een reservering maken? Neem
            gerust contact op met een van onze locaties. We helpen je graag!
          </p>
        </div>
      </section>
    </>
  );
}
