"use client";

import { useEffect } from "react";

export default function RevenueAccessReset() {
  useEffect(() => {
    void fetch("/API/revenue/clear-access", {
      method: "POST",
      cache: "no-store",
    });
  }, []);

  return null;
}