"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

/**
 * Counts up to `value` on mount / change. Formatting is delegated so
 * currency, locale and compact notation stay consistent with <Money>.
 */
export function AnimatedCounter({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const text = useTransform(motionValue, (v) => format(v));
  const previous = useRef(value);

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, motionValue, reduced]);

  return (
    <motion.span dir="ltr" className={className}>
      {text}
    </motion.span>
  );
}
