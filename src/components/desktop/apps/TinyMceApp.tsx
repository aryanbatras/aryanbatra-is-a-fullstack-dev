"use client";

import { useEffect, useRef, useState } from "react";
import { readFiles, saveFileContent } from "@/utils/finderStorage";
import CDN from "@/constants/cdn";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * TinyMCE — the real WYSIWYG rich-text editor, ported from daedalOS.
 * .rtf / .whtml files open here from Finder: .rtf is converted through
 * rtf.js into editable HTML, .whtml loads straight in. ⌘S (or the toolbar
 * save button) writes back to the Finder file system. The editor runtime is
 * served locally from /aryan/apps/tinymce so it works fully offline.
 */

interface TinyMceAppProps {
  /** File name in the Finder docs folder (e.g. "notes.whtml"). */
  file?: string;
}

export default function TinyMceApp({ file }: TinyMceAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading TinyMCE…");
  const editorRef = useRef<any>(null);

  // Resolve the file's content by name (same as Vim/TextEdit/Monaco).
  const initialContent =
    file ? readFiles().find((f) => f.name === file)?.content : undefined;
  const isRtf = file?.toLowerCase().endsWith(".rtf") ?? false;

  // Boot TinyMCE once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;

    // TinyMCE's global is loaded from the npm package.
    import("tinymce").then(async ({ default: tinymce }) => {
      if (disposed) return;
      let content = initialContent ?? "";

      // Convert RTF → HTML via rtf.js (daedalOS does exactly this).
      if (isRtf && initialContent) {
        try {
          const { RTFJS } = (await import("rtf.js")) as unknown as {
            RTFJS: {
              Document: new (data: Uint8Array) => {
                render: () => Promise<HTMLElement[]>;
              };
            };
          };
          const bytes = new TextEncoder().encode(initialContent);
          const doc = new RTFJS.Document(bytes);
          const html = await doc.render();
          content = html.map((el) => el.outerHTML).join("");
        } catch {
          // Fall back to the raw text if conversion fails.
        }
      }

      tinymce
        .init({
          base_url: CDN.TINYMCE.local + "/",
          branding: false,
          promotion: false,
          contextmenu: "",
          image_advtab: true,
          suffix: ".min",
          plugins: "code help image link save wordcount",
          toolbar:
            "save undo redo | formatselect | bold italic underline | forecolor backcolor | alignleft aligncenter alignright | outdent indent | code help",
          selector: `.${container.className.split(" ").join(".")}`,
          height: "100%",
          setup: (editor) => {
            editorRef.current = editor;
            editor.on("init", () => {
              if (content) editor.setContent(content);
              setStatus("");
              editor.focus();
            });
            // daedalOS's save callback — writes straight back to Finder.
            editor.options.set("save_onsavecallback", () => {
              const html = editor.getContent();
              const saveName = file ?? "New Rich Text Document.whtml";
              const name = saveName.toLowerCase().endsWith(".rtf")
                ? saveName.replace(/\.rtf$/i, ".whtml")
                : saveName;
              if (file) saveFileContent(name, html);
              setStatus("Saved ✓");
              window.setTimeout(() => setStatus(""), 1600);
            });
          },
        })
        .catch(() => {
          if (!disposed) setStatus("Failed to load TinyMCE");
        });
    });

    return () => {
      disposed = true;
      window.setTimeout(() => editorRef.current?.destroy?.(), 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.tinymce}>
      {status && <div className={styles.tinymceStatus}>{status}</div>}
      <div ref={containerRef} className={styles.tinymceBody} />
    </div>
  );
}
