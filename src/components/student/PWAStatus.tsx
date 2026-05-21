"use client";

import { DownloadCloud, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function PWAStatus() {
  const { isOnline, isInstallable, installApp } = usePWA();

  if (isOnline && !isInstallable) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 text-xs shadow-sm">
      {!isOnline ? (
        <div className="flex items-center gap-2 px-1 font-medium text-amber-700">
          <WifiOff className="h-3.5 w-3.5" />
          Offline mode
        </div>
      ) : null}
      {isInstallable ? (
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 px-2 text-xs" onClick={installApp}>
          <DownloadCloud className="h-3.5 w-3.5" />
          Install
        </Button>
      ) : null}
    </div>
  );
}
