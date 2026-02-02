import { Leva } from "leva";
import { useTheme } from "../../context/ThemeContext";
import { usePanelVisible } from "../../context/PanelContext";

export default function LevaPanel() {
  const { theme } = useTheme();
  const { visible } = usePanelVisible();

  const lightTheme = {
    colors: {
      elevation1: "#ffffff",
      elevation2: "#f8f8f8",
      elevation3: "#f0f0f0",
      accent1: "#dc2626",
      accent2: "#ef4444",
      accent3: "#f87171",
      highlight1: "#dc2626",
      highlight2: "#991b1b",
      highlight3: "#000000",
      vivid1: "#dc2626",
    },
    radii: {
      xs: "4px",
      sm: "6px",
      lg: "10px",
    },
    space: {
      sm: "0px",
      md: "0px",
      rowGap: "7px",
      colGap: "7px",
    },
    fontSizes: {
      root: "10px",
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
      xs: "4px",
      sm: "6px",
      lg: "10px",
    },
    space: {
      sm: "0px",
      md: "0px",
      rowGap: "7px",
      colGap: "7px",
    },
    fontSizes: {
      root: "10px",
    },
  };

  return (
    <>
      {visible && (
        <div
          style={{
            position: "fixed",
            zIndex: 1002,
          }}
        >
          <Leva
            theme={theme === "dark" ? darkTheme : lightTheme}
            hidden={visible ? false : true}
            titleBar={{
              drag: false,
              filter: false,
              position: { x: -20, y: 40 },
            }}
            
            collapsed={true}
            fill={false}
            flat={true}
            hideCopyButton={true}
            oneLineLabels={false}
          />
        </div>
      )}
    </>
  );
}
