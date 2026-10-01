"use client";

// Adapted from 21st.dev "Masonry Lightbox" by @ayushmxxn.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  description: string;
  width?: number;
  height?: number;
}

export interface MasonryLightboxProps {
  images: GalleryImage[];
  className?: string;
  /** Extra buttons shown in the opened viewer. Call close() to dismiss it. */
  renderActions?: (image: GalleryImage, close: () => void) => React.ReactNode;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;

const ENTRANCE_DURATION = 0.6;
const ENTRANCE_STAGGER = 0.05;
const ENTRANCE_STAGGER_MAX = 12;
const ENTRANCE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HOVER_LIFT = -3;
const MODAL_SPRING = { stiffness: 260, damping: 28 };

const emptySubscribe = () => () => {};

export function MasonryLightbox({ images, className = "", renderActions }: MasonryLightboxProps) {
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const prefersReducedMotion = useReducedMotion();
  const close = () => setSelected(null);

  useEffect(() => {
    if (!selected) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const modal = (
    <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-rose-ink/60 p-4 backdrop-blur-xl sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        >
          <motion.div
            layoutId={`photo-${selected.id}`}
            className="relative overflow-hidden rounded-3xl bg-card shadow-2xl"
            transition={{ type: "spring", ...MODAL_SPRING }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selected.src}
              alt={selected.alt}
              width={selected.width ?? DEFAULT_WIDTH}
              height={selected.height ?? DEFAULT_HEIGHT}
              unoptimized
              className="block h-auto max-h-[70vh] w-auto max-w-[90vw] object-contain sm:max-w-[640px]"
              priority
            />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/75 to-transparent p-5"
            >
              <p className="text-base font-medium text-white">{selected.alt}</p>
              <p className="text-sm text-white/75">{selected.description}</p>
            </motion.div>
            <button
              type="button"
              aria-label="Kapat"
              onClick={close}
              className="absolute right-2.5 top-2.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
          {renderActions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {renderActions(selected, close)}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative w-full select-none ${className}`}>
      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 lg:gap-5">
        {images.map((image, i) => (
          <motion.button
            key={image.id}
            type="button"
            layoutId={`photo-${image.id}`}
            onClick={() => setSelected(image)}
            className="group relative mb-3 block w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-blush text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:mb-4 lg:mb-5"
            style={{ breakInside: "avoid" }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: ENTRANCE_DURATION,
              delay: (i % ENTRANCE_STAGGER_MAX) * ENTRANCE_STAGGER,
              ease: ENTRANCE_EASE,
            }}
            whileHover={prefersReducedMotion ? undefined : { y: HOVER_LIFT }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width ?? DEFAULT_WIDTH}
              height={image.height ?? DEFAULT_HEIGHT}
              unoptimized
              className="block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="truncate text-sm font-medium text-white">{image.alt}</p>
              <p className="text-xs text-white/75">{image.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
      {mounted ? createPortal(modal, document.body) : null}
    </div>
  );
}
