"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (!refCode) return;

    fetch(`${API_BASE}/api/referrals/track/${encodeURIComponent(refCode)}`, {
      method: "GET",
      credentials: "include",
    }).catch(() => {});
  }, [searchParams]);

  return null;
}
