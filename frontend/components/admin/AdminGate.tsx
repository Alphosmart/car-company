"use client";

import { ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";

type AdminGateProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

export default function AdminGate({ children, allowedRoles }: AdminGateProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const hasToken =
    isClient && !!(window.localStorage.getItem("token") || window.localStorage.getItem("authToken"));

  const role = useMemo(() => {
    if (!isClient) return undefined;

    const staff = window.localStorage.getItem("staff");
    if (!staff) return undefined;

    try {
      return (JSON.parse(staff) as { role?: string }).role;
    } catch {
      return undefined;
    }
  }, [isClient]);

  const isRoleAllowed = useMemo(
    () => !allowedRoles || (role ? allowedRoles.includes(role) : false),
    [allowedRoles, role],
  );

  useEffect(() => {
    if (!isClient) return;

    if (!hasToken) {
      window.location.href = "/admin/login";
      return;
    }

    if (allowedRoles && !isRoleAllowed) {
      window.location.href = "/admin";
    }
  }, [allowedRoles, hasToken, isClient, isRoleAllowed]);

  if (!isClient || !hasToken || (allowedRoles && !isRoleAllowed)) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-ink-muted">Checking access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
