import React from "react";

/**
 * A tiny, dependency-free syntax highlighter for the TextEdit app.
 * Tokenizes with ordered per-language regex rules and returns React spans,
 * so it works fully client-side with zero network cost.
 */

export type HighlightLang =
  | "javascript"
  | "json"
  | "html"
  | "css"
  | "java"
  | "python"
  | "bash"
  | "markdown"
  | "cpp"
  | "plaintext";

interface Rule {
  type: string;
  re: RegExp;
}

const KEYWORDS_JS =
  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|import|export|from|default|async|await|try|catch|finally|throw|yield|delete|void|null|undefined|true|false|interface|type|enum|implements|public|private|protected|readonly|static|get|set|namespace|declare|as|satisfies|keyof|infer|is)\b/;

const KEYWORDS_JAVA =
  /\b(public|private|protected|static|final|void|class|interface|enum|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|package|import|this|super|abstract|synchronized|volatile|transient|native|default|instanceof|true|false|null|int|long|double|float|boolean|char|byte|short|String|var)\b/;

const KEYWORDS_PY =
  /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|pass|break|continue|global|nonlocal|yield|assert|del|in|is|not|and|or|None|True|False|self|async|await)\b/;

const KEYWORDS_BASH =
  /\b(if|then|else|elif|fi|for|while|until|do|done|case|esac|function|return|export|local|readonly|echo|cd|ls|mkdir|rm|cp|mv|touch|cat|grep|sed|awk|printf|source|exit|sudo|alias|unset|shift|test|select|time)\b/;

const KEYWORDS_C =
  /\b(if|else|for|while|do|switch|case|break|continue|return|typedef|struct|union|enum|sizeof|static|extern|const|volatile|register|inline|void|int|char|float|double|long|short|unsigned|signed|bool|true|false|class|public|private|protected|template|typename|namespace|using|new|delete|this|virtual|override|friend|operator)\b/;

const RULES: Record<HighlightLang, Rule[]> = {
  javascript: [
    { type: "comment", re: /\/\/.*$/ },
    { type: "comment", re: /\/\*[\s\S]*?\*\// },
    { type: "string", re: /`(?:[^`\\]|\\.)*`/ },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "string", re: /'(?:[^'\\\n]|\\.)*'/ },
    { type: "number", re: /\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/ },
    { type: "keyword", re: KEYWORDS_JS },
    { type: "type", re: /\b[A-Z][A-Za-z0-9_]*\b/ },
    { type: "function", re: /\b[a-zA-Z_$][\w$]*(?=\s*\()/ },
  ],
  json: [
    { type: "comment", re: /\/\/.*$/ },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "number", re: /\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/ },
    { type: "keyword", re: /\b(true|false|null)\b/ },
  ],
  html: [
    { type: "comment", re: /<!--[\s\S]*?-->/ },
    { type: "tag", re: /<\/?[a-zA-Z][\w-]*/ },
    { type: "attr", re: /\b[a-zA-Z-]+(?==)/ },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "string", re: /'(?:[^'\\\n]|\\.)*'/ },
    { type: "keyword", re: /\/?>/ },
  ],
  css: [
    { type: "comment", re: /\/\*[\s\S]*?\*\// },
    { type: "selector", re: /[.#]?[a-zA-Z][\w-]*(?=\s*[,{])/ },
    { type: "attr", re: /\b[a-z-]+(?=\s*:)/ },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "string", re: /'(?:[^'\\\n]|\\.)*'/ },
    { type: "number", re: /\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr|ch)?\b/ },
    { type: "keyword", re: /\b(import|media|keyframes|from|to|url)\b/ },
  ],
  java: [
    { type: "comment", re: /\/\/.*$/ },
    { type: "comment", re: /\/\*[\s\S]*?\*\// },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "char", re: /'(?:[^'\\\n]|\\.)'/ },
    { type: "number", re: /\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?[fLd]?\b/ },
    { type: "keyword", re: KEYWORDS_JAVA },
    { type: "type", re: /\b[A-Z][A-Za-z0-9_]*\b/ },
    { type: "function", re: /\b[a-zA-Z_$][\w$]*(?=\s*\()/ },
  ],
  python: [
    { type: "comment", re: /#.*$/ },
    { type: "string", re: /"""(?:[^"\\]|\\.)*?"""/ },
    { type: "string", re: /'''(?:[^'\\]|\\.)*?'''/ },
    { type: "string", re: /f?"(?:[^"\\\n]|\\.)*"/ },
    { type: "string", re: /f?'(?:[^'\\\n]|\\.)*'/ },
    { type: "number", re: /\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b/ },
    { type: "keyword", re: KEYWORDS_PY },
    { type: "function", re: /\b[a-zA-Z_]\w*(?=\s*\()/ },
    { type: "decorator", re: /@\w+/ },
  ],
  bash: [
    { type: "comment", re: /#.*$/ },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "string", re: /'(?:[^'\\\n]|\\.)*'/ },
    { type: "number", re: /\b\d+\b/ },
    { type: "keyword", re: KEYWORDS_BASH },
    { type: "function", re: /\b[a-zA-Z_]\w*(?=\s*\()/ },
    { type: "variable", re: /\$\{?\w+\}?/ },
  ],
  markdown: [
    { type: "heading", re: /^#{1,6}\s.*$/ },
    { type: "keyword", re: /^---+$/ },
    { type: "string", re: /`[^`]+`/ },
    { type: "bold", re: /\*\*[^*]+\*\*|__[^_]+__/ },
    { type: "italic", re: /\*[^*\n]+\*|_[^_\n]+_/ },
    { type: "link", re: /\[[^\]]+\]\([^)]+\)/ },
    { type: "list", re: /^\s*[-*+]\s/ },
    { type: "quote", re: /^>\s/ },
  ],
  cpp: [
    { type: "comment", re: /\/\/.*$/ },
    { type: "comment", re: /\/\*[\s\S]*?\*\// },
    { type: "string", re: /"(?:[^"\\\n]|\\.)*"/ },
    { type: "char", re: /'(?:[^'\\\n]|\\.)'/ },
    { type: "number", re: /\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b/ },
    { type: "keyword", re: KEYWORDS_C },
    { type: "type", re: /\b[A-Z][A-Za-z0-9_]*\b/ },
    { type: "function", re: /\b[a-zA-Z_$][\w$]*(?=\s*\()/ },
  ],
  plaintext: [],
};

const STYLES: Record<string, string> = {
  comment: "color:#6e7681;font-style:italic",
  string: "color:#98c379",
  char: "color:#98c379",
  number: "color:#d19a66",
  keyword: "color:#c678dd",
  type: "color:#e5c07b",
  function: "color:#61afef",
  tag: "color:#e06c75",
  attr: "color:#d19a66",
  selector: "color:#e06c75",
  variable: "color:#e5c07b",
  decorator: "color:#c678dd",
  heading: "color:#e06c75;font-weight:600",
  bold: "color:#abb2bf;font-weight:700",
  italic: "color:#abb2bf;font-style:italic",
  link: "color:#61afef;text-decoration:underline",
  list: "color:#c678dd",
  quote: "color:#6e7681;font-style:italic",
};

/**
 * Highlight one line of code. Returns React spans. Falls back to plain text
 * for unmatched segments.
 */
export function highlightLine(lang: HighlightLang, line: string, keyBase: string): React.ReactNode[] {
  const rules = RULES[lang] ?? [];
  if (rules.length === 0) return [line];
  const out: React.ReactNode[] = [];
  let rest = line;
  let key = 0;
  while (rest.length > 0) {
    let best: { type: string; text: string; index: number } | null = null;
    for (const rule of rules) {
      rule.re.lastIndex = 0;
      const m = rule.re.exec(rest);
      if (m && m.index === 0) {
        best = { type: rule.type, text: m[0], index: 0 };
        break;
      }
    }
    if (!best) {
      // No rule matches at position 0 — find the nearest rule match ahead
      // and emit plain text up to it (the loop will tokenize the match).
      let nextIndex = rest.length;
      for (const rule of rules) {
        rule.re.lastIndex = 0;
        const m = rule.re.exec(rest);
        if (m && m.index < nextIndex) nextIndex = m.index;
      }
      if (nextIndex === 0) {
        // Safety: consume one char to avoid an infinite loop.
        out.push(<span key={`${keyBase}-${key++}`}>{rest[0]}</span>);
        rest = rest.slice(1);
        continue;
      }
      out.push(<span key={`${keyBase}-${key++}`}>{rest.slice(0, nextIndex)}</span>);
      rest = rest.slice(nextIndex);
    } else {
      const style = parseStyle(STYLES[best.type]);
      out.push(
        <span key={`${keyBase}-${key++}`} style={style}>
          {best.text}
        </span>,
      );
      rest = rest.slice(best.text.length);
    }
  }
  return out;
}

function parseStyle(css: string | undefined): React.CSSProperties | undefined {
  if (!css) return undefined;
  const out: React.CSSProperties = {};
  for (const part of css.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === "color") out.color = v;
    else if (k === "font-style") out.fontStyle = v as React.CSSProperties["fontStyle"];
    else if (k === "font-weight") out.fontWeight = Number(v);
    else if (k === "text-decoration") out.textDecoration = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Infer the language from a file name. */
export function langFromName(name: string): HighlightLang {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)) return "javascript";
  if (ext === "json") return "json";
  if (ext === "html" || ext === "htm" || ext === "xml" || ext === "svg") return "html";
  if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less") return "css";
  if (ext === "java") return "java";
  if (ext === "py") return "python";
  if (["sh", "bash", "zsh", "command"].includes(ext)) return "bash";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "c" || ext === "cpp" || ext === "cc" || ext === "h" || ext === "hpp") return "cpp";
  return "plaintext";
}
