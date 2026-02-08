"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { SignedIn, useUser } from "@/auth/clerk";

import { BrandMark } from "@/components/atoms/BrandMark";
import { OrgSwitcher } from "@/components/organisms/OrgSwitcher";
import { UserMenu } from "@/components/organisms/UserMenu";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const displayName =
    user?.fullName ?? user?.firstName ?? user?.username ?? "Operator";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "openclaw_org_switch" || !event.newValue) return;
      window.location.reload();
    };

    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("org-switch");
      channel.onmessage = () => {
        window.location.reload();
      };
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      channel?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-app text-strong">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[260px_1fr_auto] items-center gap-0 py-3">
          <div className="flex items-center px-6">
            <BrandMark />
          </div>
          <SignedIn>
            <div className="flex items-center">
              <div className="max-w-[220px]">
                <OrgSwitcher />
              </div>
            </div>
          </SignedIn>
          <SignedIn>
            <div className="flex items-center gap-3 px-6">
              <div className="hidden text-right lg:block">
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">Operator</p>
              </div>
              <UserMenu />
            </div>
          </SignedIn>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-64px)] grid-cols-[260px_1fr] bg-slate-50">
        {children}
      </div>
    </div>
  );
}
