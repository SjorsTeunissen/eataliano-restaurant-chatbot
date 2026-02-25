import Link from "next/link";
import { Button } from "@/components/ui";

export function HeroSection() {
  return (
    <section className="bg-oven py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
        <h1 className="font-headline text-5xl uppercase tracking-wide text-crema md:text-7xl">
          Eataliano
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-body text-lg text-crema/80 md:text-xl">
          Authentieke Italiaanse keuken in Arnhem &amp; Huissen
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/menu">
            <Button size="lg">Bekijk Menu</Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="secondary"
              size="lg"
              className="border-crema text-crema hover:bg-crema/10"
            >
              Reserveer een Tafel
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
