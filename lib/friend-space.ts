// Shared by the server page and the client tabs. Must not live in a "use client"
// module: server code would receive a client reference instead of the array.
export const SPACE_TABS = ["album", "liste", "notlar", "puzzle"] as const;
export type SpaceTab = (typeof SPACE_TABS)[number];

export function parseSpaceTab(value: unknown, fallback: SpaceTab): SpaceTab {
  return SPACE_TABS.includes(value as SpaceTab) ? (value as SpaceTab) : fallback;
}
