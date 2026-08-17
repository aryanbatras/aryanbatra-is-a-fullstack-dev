import dynamic from "next/dynamic";
import { useRouter } from "next/router";

/* The same desktop component as the home page, booted immediately — no film
   to scroll through. Visiting /desktop drops you straight onto the machine
   (lock screen first, then the desktop), so the OS can be tested in one
   click. The module is heavy, so it lazy-loads exactly like on the home page. */
const MacDesktop = dynamic(
  () => import("@/layout/new/segments/MacDesktop"),
  { ssr: false, loading: () => null },
);

export default function DesktopRoute() {
  const router = useRouter();
  return (
    <MacDesktop
      open
      onClose={() => {
        // Quit — back to the home page (the film entry).
        router.push("/");
      }}
    />
  );
}
