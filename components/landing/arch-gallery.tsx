"use client";

// Adapted from 21st.dev "Arch Gallery" by @vinny_b0b96136.

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { Heart } from "lucide-react";

export type ArchItem = { src?: string; alt?: string };

const ROTATE_STEP = 6;
const Y_STEP = 18;
const OVERLAP = 0.58;
const HOVER_SCALE = 1.08;
const HOVER_LIFT = 16;

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#fecdd3,#fde68a)",
  "linear-gradient(135deg,#fbcfe8,#fecaca)",
  "linear-gradient(135deg,#fda4af,#fed7aa)",
  "linear-gradient(135deg,#fecaca,#fbcfe8)",
  "linear-gradient(135deg,#fed7aa,#fecdd3)",
];

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(min-width: 640px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function ArchGallery({ items }: { items: ArchItem[] }) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );
  const cardWidth = wide ? 180 : 96;
  const cardHeight = wide ? 240 : 128;
  const cornerRadius = wide ? 18 : 12;

  const deck = items.length ? items : PLACEHOLDER_GRADIENTS.map(() => ({}) as ArchItem);
  const total = deck.length;
  const mid = (total - 1) / 2;
  const [hovered, setHovered] = useState<number | null>(null);

  const stageWidth = cardWidth + mid * 2 * cardWidth * OVERLAP + cardWidth * 0.2;
  const stageHeight = cardHeight + mid * Y_STEP + 48;

  return (
    <div className="flex w-full items-center justify-center overflow-hidden py-6" role="group" aria-label="Fotoğraflarımız">
      <div className="relative" style={{ width: stageWidth, height: stageHeight }}>
        {deck.map((entry, index) => {
          const offset = index - mid;
          const isHovered = hovered === index;
          const translateX = offset * cardWidth * OVERLAP;
          const translateY = Math.abs(offset) * Y_STEP;

          const style: CSSProperties = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            marginLeft: -cardWidth / 2,
            marginTop: -cardHeight / 2,
            borderRadius: cornerRadius,
            overflow: "hidden",
            transform: isHovered
              ? `translate(${translateX}px, ${translateY - HOVER_LIFT}px) rotate(0deg) scale(${HOVER_SCALE})`
              : `translate(${translateX}px, ${translateY}px) rotate(${offset * ROTATE_STEP}deg) scale(1)`,
            zIndex: isHovered ? total + 1 : total - Math.abs(offset),
            transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            boxShadow: "0 12px 28px rgba(136,19,55,0.18), 0 2px 8px rgba(136,19,55,0.10)",
            border: "4px solid white",
            background: entry.src ? "#fff1f2" : PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length],
            cursor: "pointer",
          };

          return (
            <div
              key={`${entry.src ?? "ph"}-${index}`}
              style={style}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              aria-label={entry.alt || `Fotoğraf ${index + 1}`}
            >
              {entry.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.src}
                  alt={entry.alt || ""}
                  draggable={false}
                  className="pointer-events-none absolute inset-0 size-full select-none object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Heart className="size-8 fill-white/70 text-white/70" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
