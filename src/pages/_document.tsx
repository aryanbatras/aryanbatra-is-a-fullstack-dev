import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />


        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical first paint — inline so the black loader + white
                 counter paint before any bundled CSS/JS arrives: no white
                 flash, the counter is the first thing on screen. */
              html, body { background: #000; }
              .loader-overlay {
                position: fixed;
                inset: 0;
                z-index: 90;
                overflow: hidden;
                background: #000;
              }
              .loader-number {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                  "Helvetica Neue", "Segoe UI", Inter, Roboto, Arial, sans-serif;
                font-size: clamp(5rem, 14vw, 10.5rem);
                font-weight: 700;
                line-height: 1;
                letter-spacing: -0.03em;
                color: #fff;
                font-variant-numeric: tabular-nums;
              }
            `,
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
