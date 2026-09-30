"use client";

import { useEffect } from "react";

export default function UrlTemizle({ parametreler }: { parametreler: string[] }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    let degisti = false;
    for (const parametre of parametreler) {
      if (url.searchParams.has(parametre)) {
        url.searchParams.delete(parametre);
        degisti = true;
      }
    }
    if (degisti) window.history.replaceState(null, "", url.pathname + url.search);
  }, [parametreler]);

  return null;
}
