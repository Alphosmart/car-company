"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { megaMenuGroups, singleNavLinks } from "@/lib/navigation";

type StaffProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/cars", label: "Inventory" },
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
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [openMenuId, setOpenMenuId] = useState<(typeof megaMenuGroups)[number]["id"] | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpenMenuId, setMobileOpenMenuId] = useState<
    (typeof megaMenuGroups)[number]["id"] | null
  >(null);
  const overlayMode = !scrolled;
  const sellSwapGroup = megaMenuGroups.find((group) => group.id === "sell-swap") ?? null;
  const leftDesktopGroups = megaMenuGroups.filter((group) => group.id !== "sell-swap");

  const openMenu = useMemo(
    () => megaMenuGroups.find((group) => group.id === openMenuId) ?? null,
    [openMenuId],
  );

  useEffect(() => {
    const sync = () => setStaff(readStoredStaff());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 96);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
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
    <header
      className={`sticky top-0 z-50 border-b text-white transition-colors duration-300 ${
        overlayMode
          ? "border-white/10 bg-black/25 backdrop-blur-[2px]"
          : "border-white/10 bg-black/60 backdrop-blur-xl"
      }`}
      onMouseLeave={() => setOpenMenuId(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpenMenuId(null);
          setMobileOpen(false);
          setMobileOpenMenuId(null);
        }
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className={`flex items-center text-base font-bold tracking-tight text-white sm:text-lg ${
            overlayMode
              ? "lg:hidden"
              : ""
          }`}
          onClick={() => {
            setOpenMenuId(null);
            setMobileOpen(false);
            setMobileOpenMenuId(null);
          }}
        >
          <Image
            src="/assets/imgi_1_brand-logo-light.webp"
            alt="Sarkin Mota Autos logo"
            width={40}
            height={40}
            className={`object-contain ${overlayMode ? "h-12 w-12 lg:h-14 lg:w-14" : "h-10 w-10"}`}
            priority
          />
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex items-center rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-brand hover:text-brand lg:hidden"
          aria-label="Toggle navigation menu"
        >
          Menu
        </button>

        {overlayMode ? (
          <nav className="hidden flex-1 items-center lg:flex">
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-center gap-4 justify-self-start xl:gap-6">
              {leftDesktopGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onMouseEnter={() => setOpenMenuId(group.id)}
                  onFocus={() => setOpenMenuId(group.id)}
                  className={`inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition xl:text-sm ${
                    openMenuId === group.id ? "text-brand" : "text-white hover:text-white"
                  }`}
                >
                  {group.label}
                  <ChevronIcon open={openMenuId === group.id} />
                </button>
              ))}
              </div>

              <Link
                href="/"
                className="flex items-center justify-center justify-self-center"
                onClick={() => {
                  setOpenMenuId(null);
                  setMobileOpen(false);
                  setMobileOpenMenuId(null);
                }}
              >
                <Image
                  src="/assets/imgi_1_brand-logo-light.webp"
                  alt="Sarkin Mota Autos logo"
                  width={56}
                  height={56}
                  className="h-11 w-11 object-contain xl:h-14 xl:w-14"
                  priority
                />
              </Link>

              <div className="flex items-center gap-4 justify-self-end xl:gap-6">
              {sellSwapGroup ? (
                <button
                  type="button"
                  onMouseEnter={() => setOpenMenuId(sellSwapGroup.id)}
                  onFocus={() => setOpenMenuId(sellSwapGroup.id)}
                  className={`inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition xl:text-sm ${
                    openMenuId === sellSwapGroup.id ? "text-brand" : "text-white hover:text-white"
                  }`}
                >
                  {sellSwapGroup.label}
                  <ChevronIcon open={openMenuId === sellSwapGroup.id} />
                </button>
              ) : null}

              {singleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-semibold uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition hover:text-white xl:text-sm"
                  onClick={() => {
                    setOpenMenuId(null);
                    setMobileOpen(false);
                    setMobileOpenMenuId(null);
                  }}
                >
                  {link.label}
                </Link>
              ))}
              </div>
            </div>
          </nav>
        ) : (
          <nav className="hidden flex-1 items-center justify-end gap-6 lg:flex">
            {megaMenuGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onMouseEnter={() => setOpenMenuId(group.id)}
                onFocus={() => setOpenMenuId(group.id)}
                className={`inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide transition ${
                  openMenuId === group.id ? "text-brand" : "text-white/85 hover:text-white"
                }`}
              >
                {group.label}
                <ChevronIcon open={openMenuId === group.id} />
              </button>
            ))}

            {singleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:text-white"
                onClick={() => {
                  setOpenMenuId(null);
                  setMobileOpen(false);
                  setMobileOpenMenuId(null);
                }}
              >
                {link.label}
              </Link>
            ))}

            {staff ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-brand hover:text-brand"
                  onClick={() => {
                    setOpenMenuId(null);
                    setMobileOpen(false);
                    setMobileOpenMenuId(null);
                  }}
                >
                  Dashboard
                </Link>
                <span className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/90">
                  {staff.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-brand hover:text-brand"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:border-brand hover:text-brand"
                onClick={() => {
                  setOpenMenuId(null);
                  setMobileOpen(false);
                  setMobileOpenMenuId(null);
                }}
              >
                Login
              </Link>
            )}
          </nav>
        )}
      </div>

      {openMenu ? (
        <div className="absolute inset-x-0 top-full hidden border-t border-white/10 bg-black/40 px-4 py-4 backdrop-blur-xl lg:block sm:px-6">
          <div className="mx-auto w-full max-w-7xl rounded-2xl border border-white/10 bg-black/75 p-6 shadow-2xl">
            <p className="text-sm italic text-brand">{openMenu.tagline}</p>
            <div className="mt-4 h-px w-full bg-white/10" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {openMenu.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border border-white/5 bg-white/2 p-4 transition hover:border-brand/40 hover:bg-white/4"
                  onClick={() => {
                    setOpenMenuId(null);
                    setMobileOpen(false);
                    setMobileOpenMenuId(null);
                  }}
                >
                  <p className="font-semibold text-white transition group-hover:text-brand">{item.title}</p>
                  <p className="mt-1 text-sm text-white/65">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-black/90 px-4 py-4 lg:hidden sm:px-6">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3">
            {megaMenuGroups.map((group) => (
              <div key={group.id} className="rounded-xl border border-white/10 bg-white/3">
                <button
                  type="button"
                  onClick={() =>
                    setMobileOpenMenuId((current) => (current === group.id ? null : group.id))
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-semibold uppercase tracking-wide text-white">{group.label}</span>
                  <span className="text-xs text-brand">
                    {mobileOpenMenuId === group.id ? "Close" : "Open"}
                  </span>
                </button>
                {mobileOpenMenuId === group.id ? (
                  <div className="border-t border-white/10 px-4 pb-4 pt-3">
                    <p className="text-xs italic text-brand">{group.tagline}</p>
                    <div className="mt-3 grid gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="rounded-lg border border-white/10 px-3 py-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            setMobileOpen(false);
                            setMobileOpenMenuId(null);
                          }}
                        >
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-white/60">{item.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="mt-1 rounded-xl border border-white/10 bg-white/3 p-3">
              <div className="flex flex-col gap-2">
                {singleNavLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white">
                    {link.label}
                  </Link>
                ))}
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white"
                    onClick={() => {
                      setOpenMenuId(null);
                      setMobileOpen(false);
                      setMobileOpenMenuId(null);
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                {staff ? (
                  <>
                    <Link
                      href="/admin"
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white"
                      onClick={() => {
                        setOpenMenuId(null);
                        setMobileOpen(false);
                        setMobileOpenMenuId(null);
                      }}
                    >
                      Dashboard
                    </Link>
                    <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80">
                      Logged in as {staff.name}
                    </span>
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-lg border border-white/10 px-3 py-2 text-left text-sm font-semibold text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                    <Link
                      href="/login"
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white"
                      onClick={() => {
                        setOpenMenuId(null);
                        setMobileOpen(false);
                        setMobileOpenMenuId(null);
                      }}
                    >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
