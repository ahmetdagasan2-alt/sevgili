"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

// Fixed positions so server and client render the same markup.
const HEARTS = [
  { left: "6%", size: 14, delay: 0, duration: 14 },
  { left: "18%", size: 22, delay: 3, duration: 18 },
  { left: "32%", size: 12, delay: 7, duration: 15 },
  { left: "47%", size: 18, delay: 1.5, duration: 20 },
  { left: "61%", size: 10, delay: 5, duration: 13 },
  { left: "74%", size: 20, delay: 9, duration: 17 },
  { left: "88%", size: 14, delay: 2.5, duration: 16 },
];

export function FloatingHearts() {
  // Hidden via CSS for reduced motion so server and client markup always match.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {HEARTS.map((h, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: h.left }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: "-110vh", opacity: [0, 0.7, 0.7, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
        >
          <Heart style={{ width: h.size, height: h.size }} className="fill-primary/30 text-primary/30" />
        </motion.div>
      ))}
    </div>
  );
}
