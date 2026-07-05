import { cn } from "@/lib/utils";

/** The brand seal: a miniature guilloché rosette, like a banknote stamp. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-8 shrink-0", className)}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="16" cy="16" r="14" opacity="0.9" />
        <circle cx="16" cy="16" r="10" opacity="0.55" />
        <ellipse cx="16" cy="16" rx="14" ry="6" opacity="0.4" />
        <ellipse cx="16" cy="16" rx="6" ry="14" opacity="0.4" />
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="7"
          transform="rotate(45 16 16)"
          opacity="0.3"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="7"
          transform="rotate(-45 16 16)"
          opacity="0.3"
        />
      </g>
      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-fraunces), serif"
        fill="currentColor"
        stroke="none"
      >
        ₨$
      </text>
    </svg>
  );
}
