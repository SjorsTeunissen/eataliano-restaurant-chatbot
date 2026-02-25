import { ChefHat, MapPin, ShoppingBag } from "lucide-react";

const VALUES = [
  {
    icon: ChefHat,
    title: "Verse Ingredienten",
    description:
      "Wij gebruiken alleen de beste en meest verse ingredienten voor onze gerechten, rechtstreeks van Italiaanse leveranciers.",
  },
  {
    icon: MapPin,
    title: "Twee Locaties",
    description:
      "Bezoek ons in Arnhem of Huissen. Twee locaties, dezelfde authentieke Italiaanse sfeer en smaak.",
  },
  {
    icon: ShoppingBag,
    title: "Online Bestellen",
    description:
      "Bestel eenvoudig online en laat uw favoriete Italiaanse gerechten bezorgen of haal ze op.",
  },
] as const;

export function WhyEataliano() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-center font-headline text-3xl text-oven md:text-4xl">
          Waarom Eataliano?
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fiamma/10">
                <Icon className="text-fiamma" size={28} />
              </div>
              <h3 className="mt-4 font-headline text-xl text-oven">{title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-oven/70">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
