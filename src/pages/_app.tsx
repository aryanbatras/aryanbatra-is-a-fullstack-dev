import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "../context/ThemeContext";
import { PanelProvider } from "../context/PanelContext";
import Navbar from "../layout/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <PanelProvider>
        <Navbar />
        <Component {...pageProps} />
      </PanelProvider>
    </ThemeProvider>
  );
}
