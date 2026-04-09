import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/cars", label: "Inventory" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/test-drives", label: "Test Drives" },
  { href: "/admin/leads", label: "Leads CRM" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/company", label: "Company" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/home-carousel", label: "Home Carousel" },
  { href: "/admin/staff", label: "Staff" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-black/10 bg-surface lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
          <div className="border-b border-black/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Admin Dashboard</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Sarkin Mota Autos</h2>
          </div>

          <nav className="p-2">
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-brand-soft hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-black/10 p-3">
            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
