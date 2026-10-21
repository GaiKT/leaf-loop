"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A thin bar at the top that creeps forward after a tap on an internal link and finishes when the new page
 * is there. Pages read the database on every visit, so a tap can take a moment on a slow phone connection.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function stop() {
      clearInterval(timer.current);
      running.current = false;
    }

    function start() {
      if (running.current) return;
      running.current = true;
      clearTimeout(hideTimer.current);
      setVisible(true);
      setProgress(0.12);
      let ticks = 0;
      timer.current = setInterval(() => {
        ticks += 1;
        // Ease toward 90% and wait there. After 15 s give up so the bar never hangs forever.
        setProgress((p) => p + (0.9 - p) * 0.12);
        if (ticks > 100) {
          stop();
          setVisible(false);
        }
      }, 150);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      stop();
    };
  }, []);

  // The new page has arrived: fill the bar, then fade it out.
  useEffect(() => {
    if (!running.current) return;
    clearInterval(timer.current);
    running.current = false;
    setProgress(1);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 350);
    return () => clearTimeout(hideTimer.current);
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="nav-progress"
      style={{ transform: `scaleX(${progress})`, opacity: visible ? 1 : 0 }}
    />
  );
}
