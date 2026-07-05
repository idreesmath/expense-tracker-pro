"use client";

import { Plus } from "lucide-react";
import { useAppData } from "@/components/app-context";
import { Button } from "@/components/ui/button";
import type { TransactionType } from "@/types/database";

export function AddEntryButton({
  kind,
  label,
}: {
  kind: TransactionType;
  label: string;
}) {
  const { openEntry } = useAppData();
  return (
    <Button onClick={() => openEntry(kind)}>
      <Plus aria-hidden /> {label}
    </Button>
  );
}
