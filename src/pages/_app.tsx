import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/saira/wdth.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "../context/ThemeContext";
import { PanelProvider } from "../context/PanelContext";
import Navbar from "../layout/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <PanelProvider>
        <div className={`${GeistSans.variable} geist-root`} style={{ display: "contents" }}>
          <Navbar />
          <Component {...pageProps} />
        </div>
      </PanelProvider>
    </ThemeProvider>
  );
}
