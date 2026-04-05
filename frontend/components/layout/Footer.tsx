export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm text-ink-muted sm:px-6 md:grid-cols-2">
        <div className="grid gap-3">
          <p className="font-semibold text-foreground">Sarkin Mota Autos</p>
          <p>Plot 12, Gwarinpa, Abuja</p>
          <p>+234 801 234 5678</p>
          <p>info@sarkinmotaautos.com</p>
          <div className="flex gap-3">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">
              Facebook
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="underline">
              Instagram
            </a>
            <a href="https://wa.me/2348012345678" target="_blank" rel="noopener noreferrer" className="underline">
              WhatsApp
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-black/10">
          <iframe
            title="Sarkin Mota Autos map"
            src="https://maps.google.com/maps?q=Abuja%20Nigeria&t=&z=13&ie=UTF8&iwloc=&output=embed"
            className="h-55 w-full"
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  );
}
