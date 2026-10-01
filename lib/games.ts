import { Puzzle, type LucideIcon } from "lucide-react";

export type Game = {
  slug: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Tailwind classes for the card's accent gradient */
  accent: string;
  comingSoon?: boolean;
};

/** Game menu registry — add a new game by adding an entry here. */
export const GAMES: Game[] = [
  {
    slug: "puzzle",
    title: "Fotoğraf Puzzle",
    description: "Fotoğraflarımızdan birini seç, parçalara ayır ve birlikte yeniden birleştir.",
    href: "/games/puzzle",
    icon: Puzzle,
    accent: "from-rose-200 to-orange-100",
  },
];
