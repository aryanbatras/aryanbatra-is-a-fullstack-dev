import { GeistSans } from "geist/font/sans";
import Head from "next/head";
import "@/styles/globals.css";
import "@/styles/components/animation/FoldText.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "../context/ThemeContext";
import { PanelProvider } from "../context/PanelContext";
import Navbar from "../layout/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <PanelProvider>
        <Head>
          <title>Aryan Batra — Full-Stack Developer</title>
          <meta
            name="description"
            content="Aryan Batra — full-stack developer. A scroll-scrubbed showreel film that boots straight into a working desktop."
          />
        </Head>
        <div className={`${GeistSans.variable} geist-root`} style={{ display: "contents" }}>
          <Navbar />
          <Component {...pageProps} />
        </div>
      </PanelProvider>
    </ThemeProvider>
  );
}
