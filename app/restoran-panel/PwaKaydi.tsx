"use client";

import { useEffect } from "react";

/** Paneli telefonda "ana ekrana ekle" ile açılabilir yapmak için service worker kaydı. */
export default function PwaKaydi() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/restoran-panel" }).catch(() => {});
  }, []);

  return null;
}
