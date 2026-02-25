import type { Metadata } from "next";
import { UtensilsCrossed, Heart, Users } from "lucide-react";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Over Ons — Eataliano",
  description:
    "Leer meer over Eataliano, ons verhaal en onze passie voor authentieke Italiaanse keuken.",
};

const VALUES = [
  {
    icon: UtensilsCrossed,
    title: "Verse Ingrediënten",
    description:
      "Wij werken uitsluitend met verse, seizoensgebonden ingrediënten. Veel van onze producten worden rechtstreeks uit Italië geïmporteerd.",
  },
  {
    icon: Heart,
    title: "Authentieke Recepten",
    description:
      "Onze recepten zijn doorgegeven van generatie op generatie. Elke schotel vertelt een verhaal van Italiaanse traditie en vakmanschap.",
  },
  {
    icon: Users,
    title: "Warm Onthaal",
    description:
      "Bij Eataliano ben je geen gast, maar familie. Wij zorgen ervoor dat iedereen zich welkom voelt, van het eerste moment tot het laatste.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="bg-oven py-16 text-crema">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h1 className="font-headline text-4xl font-bold uppercase tracking-wide md:text-5xl">
            Over Ons
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-crema/80">
            De passie achter Eataliano
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="font-headline text-3xl font-semibold text-oven">
            Ons Verhaal
          </h2>
          <div className="mt-6 space-y-4 text-oven/80">
            <p>
              Eataliano is geboren uit een diepe liefde voor de Italiaanse
              keuken. Wat begon als een droom om authentieke Italiaanse smaken
              naar Nederland te brengen, is uitgegroeid tot twee bruisende
              restaurants in Arnhem en Huissen.
            </p>
            <p>
              Onze koks combineren traditionele Italiaanse bereidingswijzen met
              de beste lokale en geïmporteerde ingrediënten. Van handgemaakte
              pasta tot houtoven-pizza&apos;s — elk gerecht wordt met zorg en
              passie bereid.
            </p>
            <p>
              Bij Eataliano geloven we dat goed eten mensen samenbrengt. Daarom
              creëren we niet alleen maaltijden, maar herinneringen. Of je nu
              komt voor een romantisch diner, een familiefeest of een snelle
              lunch — je bent altijd welkom.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-oven/5 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="text-center font-headline text-3xl font-semibold text-oven">
            Onze Waarden
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fiamma/10">
                  <Icon className="h-7 w-7 text-fiamma" />
                </div>
                <h3 className="mt-4 font-headline text-xl font-semibold text-oven">
                  {title}
                </h3>
                <p className="mt-2 text-oven/70">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h2 className="font-headline text-3xl font-semibold text-oven">
            Kom Langs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-oven/70">
            Wij nodigen je van harte uit om de sfeer en smaken van Eataliano
            zelf te ervaren. Bezoek ons in Arnhem of Huissen, of neem contact
            met ons op voor meer informatie.
          </p>
        </div>
      </section>
    </>
  );
}
