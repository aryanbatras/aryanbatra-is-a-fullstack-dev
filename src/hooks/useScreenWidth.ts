import { useCallback, useState, useEffect } from "react";
export default function useScreenWidth() {
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 0;
  });
  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [width]);
  return { width };
}
