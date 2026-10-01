"use client";

import { useState, type ReactNode } from "react";
import { Camera, Gamepad2, ListChecks, MessageCircleHeart } from "lucide-react";
import { SPACE_TABS, type SpaceTab } from "@/lib/friend-space";
import { cn } from "@/lib/utils";

const META: Record<SpaceTab, { label: string; icon: typeof Camera }> = {
  album: { label: "Albüm", icon: Camera },
  liste: { label: "Liste", icon: ListChecks },
  notlar: { label: "Notlar", icon: MessageCircleHeart },
  puzzle: { label: "Puzzle", icon: Gamepad2 },
};

/** All panels are rendered on the server up front; switching tabs is instant. */
export function FriendSpaceTabs({
  initialTab,
  panels,
  badges,
}: {
  initialTab: SpaceTab;
  panels: Record<SpaceTab, ReactNode>;
  badges?: Partial<Record<SpaceTab, number>>;
}) {
  const [tab, setTab] = useState<SpaceTab>(initialTab);

  function choose(next: SpaceTab) {
    setTab(next);
    window.history.replaceState(null, "", `?tab=${next}`);
  }

  return (
    <>
      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-card p-1 shadow-xs">
        {SPACE_TABS.map((t) => {
          const { label, icon: Icon } = META[t];
          const badge = badges?.[t] ?? 0;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => choose(t)}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                tab === t && "bg-primary text-primary-foreground hover:text-primary-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
              {badge > 0 ? (
                <span className="rounded-full bg-white/90 px-1.5 text-xs font-semibold text-primary">{badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {SPACE_TABS.map((t) => (
        // Keep panels mounted so form drafts survive tab switches.
        <div key={t} role="tabpanel" hidden={tab !== t}>
          {panels[t]}
        </div>
      ))}
    </>
  );
}
