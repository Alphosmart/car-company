"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StaffProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/cars", label: "Inventory" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function readStoredStaff(): StaffProfile | null {
  if (typeof window === "undefined") return null;

  const token = window.localStorage.getItem("token") || window.localStorage.getItem("authToken");
  const storedStaff = window.localStorage.getItem("staff");

  if (!token || !storedStaff) return null;

  try {
    return JSON.parse(storedStaff) as StaffProfile;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [staff, setStaff] = useState<StaffProfile | null>(() => readStoredStaff());

  useEffect(() => {
    const sync = () => setStaff(readStoredStaff());
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  const logout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("staff");
    window.dispatchEvent(new Event("auth-changed"));
    setStaff(null);
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          Sarkin Mota Autos
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-muted transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          {staff ? (
            <>
              <Link href="/admin" className="text-ink-muted transition hover:text-foreground">
                Admin
              </Link>
              <span className="rounded-lg border border-black/10 px-2 py-1 text-xs text-foreground">
                {staff.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-ink-muted transition hover:text-foreground"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-ink-muted transition hover:text-foreground">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
