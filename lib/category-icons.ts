import {
  Banknote,
  Briefcase,
  Car,
  CircleDashed,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  PawPrint,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Category icons are stored as slugs in the DB and resolved here,
 * so custom categories can pick from a curated, coherent set.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  receipt: Receipt,
  clapperboard: Clapperboard,
  plane: Plane,
  briefcase: Briefcase,
  banknote: Banknote,
  "trending-up": TrendingUp,
  gift: Gift,
  "circle-dashed": CircleDashed,
  home: Home,
  shirt: Shirt,
  smartphone: Smartphone,
  wallet: Wallet,
  "paw-print": PawPrint,
};

export function categoryIcon(slug: string | null | undefined): LucideIcon {
  return (slug && CATEGORY_ICONS[slug]) || CircleDashed;
}

/** Curated swatches for custom categories — chart-safe hues. */
export const CATEGORY_COLORS = [
  "#177154",
  "#128a63",
  "#d98e2b",
  "#2a7fbf",
  "#c74057",
  "#5a63b6",
  "#b65aa0",
  "#c46b3a",
  "#2e8b57",
  "#8a938e",
] as const;
