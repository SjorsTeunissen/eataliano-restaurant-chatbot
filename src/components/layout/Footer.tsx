export function Footer() {
  return (
    <footer className="bg-oven py-12 text-crema">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-headline text-2xl">Eataliano</h3>
            <p className="text-sm text-crema/70">
              Authentieke Italiaanse keuken in het hart van Gelderland.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-headline text-lg text-fiamma">Arnhem</h4>
            <address className="space-y-1 text-sm not-italic">
              <p>Steenstraat 56, 6828 CE Arnhem</p>
              <p>Tel: 026-370 21 60</p>
            </address>
          </div>

          <div>
            <h4 className="mb-3 font-headline text-lg text-fiamma">Huissen</h4>
            <address className="space-y-1 text-sm not-italic">
              <p>Langestraat 78, 6851 TH Huissen</p>
              <p>Tel: 026-325 37 87</p>
            </address>
          </div>
        </div>

        <div className="mt-8 border-t border-crema/20 pt-8 text-center text-sm text-crema/50">
          <p>&copy; {new Date().getFullYear()} Eataliano. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
}
