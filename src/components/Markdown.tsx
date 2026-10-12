import { Fragment, ReactNode, useState } from "react";
import { Check, Copy } from "lucide-react";

function inline(text: string, key: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    const k = `${key}-${i}`;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 1) return <code key={k} className="rounded bg-muted px-1 py-0.5 text-[12px] text-cyan-300">{p.slice(1, -1)}</code>;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={k} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) return <em key={k}>{p.slice(1, -1)}</em>;
    return <Fragment key={k}>{p}</Fragment>;
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 overflow-hidden rounded-md border bg-[hsl(224_32%_6%)]">
      <div className="flex items-center justify-between border-b px-3 py-1 text-[11px] text-muted-foreground">
        <span>{lang || "text"}</span>
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

/** Minimal, dependency-free markdown renderer for chat output (headings, lists, tables, code, quotes). */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const k = `l${i}`;
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push(<CodeBlock key={k} lang={lang} code={buf.join("\n")} />);
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!/^\|[\s-:|]+\|$/.test(lines[i])) rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      out.push(
        <div key={k} className="my-2 overflow-x-auto"><table className="w-full text-sm border rounded">
          <thead><tr>{rows[0]?.map((c, j) => <th key={j} className="border-b px-2 py-1 text-left font-medium">{inline(c, `${k}h${j}`)}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j} className="border-b border-border/50 px-2 py-1">{inline(c, `${k}${ri}${j}`)}</td>)}</tr>)}</tbody>
        </table></div>,
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s/, ""));
      const L = ordered ? "ol" : "ul";
      out.push(<L key={k} className={`my-1.5 ml-5 space-y-0.5 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((it, j) => <li key={j}>{inline(it, `${k}${j}`)}</li>)}</L>);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { out.push(<p key={k} className={`mt-3 mb-1 font-semibold ${h[1].length <= 2 ? "text-base" : "text-sm"}`}>{inline(h[2], k)}</p>); i++; continue; }
    if (line.startsWith(">")) { out.push(<blockquote key={k} className="my-1.5 border-l-2 border-violet-400/50 pl-3 text-muted-foreground text-[13px]">{inline(line.replace(/^>\s?/, ""), k)}</blockquote>); i++; continue; }
    if (line.trim() === "") { i++; continue; }
    out.push(<p key={k} className="my-1.5 leading-relaxed">{inline(line, k)}</p>);
    i++;
  }
  return <div className="text-sm">{out}</div>;
}
