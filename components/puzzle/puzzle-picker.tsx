"use client";

import Link from "next/link";
import { useState } from "react";
import { GRID_LABELS, GRID_SIZES, type GridSize } from "@/lib/puzzle";
import { cn } from "@/lib/utils";

type PickerPhoto = { id: string; url: string; caption: string | null };
export type PickerSection = { title: string; photos: PickerPhoto[] };

export function PuzzlePicker({ sections, initialSize }: { sections: PickerSection[]; initialSize: GridSize }) {
  const [gridSize, setGridSize] = useState<GridSize>(initialSize);

  function choose(size: GridSize) {
    setGridSize(size);
    // Keep the URL shareable without a server round trip.
    window.history.replaceState(null, "", `?size=${size}`);
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" role="radiogroup" aria-label="Zorluk">
        {GRID_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={s === gridSize}
            onClick={() => choose(s)}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              s === gridSize
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            {GRID_LABELS[s]}
          </button>
        ))}
      </div>

      {sections.map((section) => (
        <section key={section.title} className="mb-10">
          {sections.length > 1 ? (
            <h2 className="mb-4 text-xl font-semibold text-rose-ink">{section.title}</h2>
          ) : null}
          <PhotoGrid photos={section.photos} gridSize={gridSize} />
        </section>
      ))}
    </>
  );
}

function PhotoGrid({ photos, gridSize }: { photos: PickerPhoto[]; gridSize: GridSize }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            href={`/games/puzzle/${photo.id}?size=${gridSize}`}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-blush shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? ""}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.7) 1px, transparent 1px)",
                backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
              }}
            />
          </Link>
        ))}
      </div>
    </>
  );
}
