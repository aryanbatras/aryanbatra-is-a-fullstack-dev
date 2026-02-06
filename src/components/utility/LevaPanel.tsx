import { Leva } from "leva";
import { useTheme } from "../../context/ThemeContext";
import { usePanelVisible } from "../../context/PanelContext";
import useScreenWidth from "../../hooks/useScreenWidth";

export default function LevaPanel() {
  const { theme } = useTheme();
  const { visible } = usePanelVisible();
  const { width } = useScreenWidth();
  const isLargeScreen = width > 768;

  const lightTheme = {
    colors: {
      elevation1: "#ffffff",
      elevation2: "#fefefe",
      elevation3: "#f7f7f7",
      accent1: "#dc2626",
      accent2: "#ef4444",
      accent3: "#f87171",
      highlight1: "#000000",
      highlight2: "#000000",
      highlight3: "#000000",
      vivid1: "#000000",
    },
    radii: {
      xs: isLargeScreen ? "4px" : "2px",
      sm: isLargeScreen ? "4px" : "2px",
      lg: isLargeScreen ? "4px" : "2px",
    },
    space: {
      sm: isLargeScreen ? "0px" : "0px",
      md: isLargeScreen ? "40px" : "40px",
      rowGap: isLargeScreen ? "34px" : "12px",
      colGap: isLargeScreen ? "112px" : "12px",
    },
    fontSizes: {
      root: isLargeScreen ? "16px" : "16px",
    },
  };

  const darkTheme = {
    colors: {
      elevation1: "#0a0a0a",
      elevation2: "#1a1a1a",
      elevation3: "#2a2a2a",
      accent1: "#cc3333",
      accent2: "#dd4444",
      accent3: "#ee5555",
      highlight1: "#ffffff",
      highlight2: "#ffffff",
      highlight3: "#ffffff",
      vivid1: "#bb2222",
    },
    radii: {
      xs: isLargeScreen ? "4px" : "2px",
      sm: isLargeScreen ? "4px" : "2px",
      lg: isLargeScreen ? "4px" : "2px",
    },
    space: {
      sm: isLargeScreen ? "0px" : "0px",
      md: isLargeScreen ? "40px" : "40px",
      rowGap: isLargeScreen ? "34px" : "12px",
      colGap: isLargeScreen ? "112px" : "12px",
    },
    fontSizes: {
      root: isLargeScreen ? "16px" : "16px",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 1002,
        display: visible ? "block" : "none",
      }}
    >
      <Leva
        theme={theme === "dark" ? darkTheme : lightTheme}
        hidden={!visible}
        titleBar={{
          drag: false,
          filter: false,
          position: { x: -25, y: -20 },
        }}
        
        collapsed={false}
        fill={true}
        flat={true}
        hideCopyButton={true}
        oneLineLabels={false}
      />
    </div>
  );
}
