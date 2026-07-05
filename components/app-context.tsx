"use client";

import { createContext, useContext } from "react";
import type {
  Category,
  LedgerEntry,
  PaymentMethod,
  Profile,
  Settings,
  TransactionType,
} from "@/types/database";

export interface AppData {
  profile: Profile;
  settings: Settings;
  email: string;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  /** Opens the global add/edit entry dialog (FAB, quick-add, palette). */
  openEntry: (kind: TransactionType, entry?: LedgerEntry) => void;
  openPalette: () => void;
}

const AppContext = createContext<AppData | null>(null);

export const AppContextProvider = AppContext.Provider;

export function useAppData(): AppData {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used inside the app shell");
  return ctx;
}
