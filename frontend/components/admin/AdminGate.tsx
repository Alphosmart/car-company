"use client";

import { ReactNode, useEffect } from "react";

type AdminGateProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

export default function AdminGate({ children, allowedRoles }: AdminGateProps) {
  const hasToken =
    typeof window !== "undefined" &&
    !!(window.localStorage.getItem("token") || window.localStorage.getItem("authToken"));
  const staff =
    typeof window !== "undefined" ? window.localStorage.getItem("staff") : null;
  const role = staff ? (() => {
    try {
      return JSON.parse(staff).role as string | undefined;
    } catch {
      return undefined;
    }
  })() : undefined;
  const isRoleAllowed = !allowedRoles || (role ? allowedRoles.includes(role) : false);

  useEffect(() => {
    if (!hasToken) {
      window.location.href = "/admin/login";
      return;
    }

    if (allowedRoles && !isRoleAllowed) {
      window.location.href = "/admin";
    }
  }, [allowedRoles, hasToken, isRoleAllowed]);

  if (!hasToken || (allowedRoles && !isRoleAllowed)) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-ink-muted">Checking access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
