import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/cars", label: "Inventory" },
  { href: "/admin/leads", label: "Leads CRM" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/staff", label: "Staff" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      <nav className="mb-4 overflow-x-auto rounded-2xl border border-black/10 bg-surface">
        <div className="flex min-w-max items-center gap-2 p-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition hover:bg-brand-soft hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-auto" />
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
