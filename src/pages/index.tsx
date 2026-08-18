import { useCallback, useState } from "react";
import dynamic from "next/dynamic";

/* The desktop OS is the heaviest client-side module — loads lazily after
   first paint so the initial JS bundle stays small. */
const MacDesktop = dynamic(
  () => import("@/layout/new/segments/MacDesktop"),
  { ssr: false, loading: () => null },
);

/**
 * The home page now boots straight into the desktop (lock screen first,
 * then the desktop). The scroll-scrubbed showreel film has been removed
 * from the default flow — a "Watch Original Video" button on the lock
 * screen lets visitors replay it at 1.5× if they want.
 */
export default function Home() {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const open = useCallback(() => setDesktopOpen(true), []);
  const close = useCallback(() => setDesktopOpen(false), []);

  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#000" }}>
      <MacDesktop open={desktopOpen} onClose={close} />
    </main>
  );
}
