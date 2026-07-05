"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production builds. */
export function SwRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is progressive enhancement; ignore failures.
      });
    }
  }, []);
  return null;
}
