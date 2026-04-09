import Link from "next/link";
import { getCompanyProfile } from "@/lib/api";

export default async function Footer() {
  const profile = await getCompanyProfile();
  const contact = profile.settings.contact;
  const social = profile.settings.social;

  return (
    <footer className="border-t border-black/10 bg-black px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Sarkin Mota Autos</p>
            <p className="max-w-xs text-sm text-white/70">
              Premium vehicles, verified support, and a buying experience built around trust.
            </p>
            <div className="space-y-2 text-sm text-white/70">
              <p>{contact.address}</p>
              <p>
                <a className="transition hover:text-brand" href={`tel:${contact.phone.replace(/[^\\d+]/g, "")}`}>
                  {contact.phone}
                </a>
              </p>
              <p>
                <a className="transition hover:text-brand" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-brand">Explore</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="/cars" className="transition hover:text-brand">Browse Inventory</Link></li>
              <li><Link href="/about" className="transition hover:text-brand">About Us</Link></li>
              <li><Link href="/contact" className="transition hover:text-brand">Contact</Link></li>
              <li><Link href="/news-events" className="transition hover:text-brand">News and Events</Link></li>
              <li><Link href="/sell" className="transition hover:text-brand">Sell or Swap</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-brand">Tools</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="/tools/ai-car-match" className="transition hover:text-brand">AI Car Match</Link></li>
              <li><Link href="/tools/loan-calculator" className="transition hover:text-brand">Loan Calculator</Link></li>
              <li><Link href="/tools/compare" className="transition hover:text-brand">Compare Vehicles</Link></li>
              <li><Link href="/tools/value-estimator" className="transition hover:text-brand">Value Estimator</Link></li>
              <li><Link href="/tools/history-check" className="transition hover:text-brand">Car History Check</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-brand">Follow Us</h3>
            <div className="flex flex-wrap gap-4">
              <a href={social.x} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-black" aria-label="X">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.727l-5.1-6.657-5.848 6.657H2.422l7.723-8.835L1.254 2.25h6.977l4.6 6.088 5.391-6.088zM17.002 18.807h1.844L6.603 3.552H4.674l12.328 15.255z" /></svg>
              </a>
              <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-black" aria-label="YouTube">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 10 22 10s0 1.254-.418 2.814c-.23.861-.907 1.538-1.768 1.768C19.254 14.998 10 15 10 15s-9.254 0-10.812-.418c-.861-.23-1.538-.907-1.768-1.768C-2 11.254 0 10 0 10s0-1.254.418-2.814c.23-.861.907-1.538 1.768-1.768C.746 5.002 10 5 10 5s9.254 0 10.812.418zM8 12.846V7.154l6 2.846-6 2.846z" clipRule="evenodd" /></svg>
              </a>
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-black" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0C4.477 0 0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.879V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.989C16.343 19.128 20 14.991 20 10c0-5.523-4.477-10-10-10z" /></svg>
              </a>
              <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-black" aria-label="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.68v13.67a2.4 2.4 0 0 1-2.4 2.4 2.4 2.4 0 0 1-2.4-2.4c0-1.41 1.08-2.59 2.46-2.59a3.65 3.65 0 0 1 .67.07v-3.72a6.5 6.5 0 0 0-.67-.07 6.19 6.19 0 0 0-6.18 6.18 6.2 6.2 0 0 0 6.18 6.18 6.15 6.15 0 0 0 6.18-6.18V9.5a8.06 8.06 0 0 0 3.77 1.7z" /></svg>
              </a>
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-black" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="6" r="1" fill="currentColor" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-sm text-white/50">
          <p>&copy; 2026 Sarkin Mota Autos. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
