"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Modern top loading strip — a thin gold bar that sweeps across the top of the
 * window on every in-app navigation, then completes and fades. Pure client
 * timing keyed off the pathname (App Router has no router events in 14.x);
 * client transitions are fast, so this reads as a quick progress sweep. Fixed
 * above all content, pointer-events-none.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip the very first mount (no navigation happened yet).
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setVisible(true);
    setProgress(8);
    const ramp = setTimeout(() => setProgress(90), 40); // quick climb to 90%
    const finish = setTimeout(() => setProgress(100), 360); // commit
    const hide = setTimeout(() => setVisible(false), 680); // fade out
    return () => {
      clearTimeout(ramp);
      clearTimeout(finish);
      clearTimeout(hide);
    };
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" aria-hidden>
      <div
        className="h-full bg-punch transition-[width,opacity] duration-300 ease-out"
        style={{
          width: visible ? `${progress}%` : "0%",
          opacity: visible ? 1 : 0,
          boxShadow: "0 0 10px 0 #FFB000, 2px 0 0 0 #141412",
        }}
      />
    </div>
  );
}
