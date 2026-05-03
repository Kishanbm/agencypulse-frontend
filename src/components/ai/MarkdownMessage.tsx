import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { ExternalLink, Download } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders an AI assistant message as markdown with smart link handling.
 *
 * Link routing rules:
 *   - Relative paths starting with `/` (e.g. `/clients/abc/...`) → React Router <Link>.
 *   - Absolute URLs to our storage (signed PDFs etc.) → external `<a>` with download icon.
 *   - All other absolute URLs → external `<a target="_blank">` with external icon.
 */
export function MarkdownMessage({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("ai-md text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const url = href ?? "#";

            // Internal app link
            if (url.startsWith("/") && !url.startsWith("//")) {
              return (
                <Link
                  to={url}
                  className="inline-flex items-center gap-1 text-violet font-medium hover:underline underline-offset-2"
                >
                  {children}
                </Link>
              );
            }

            // Detect download-style links (signed S3/GCS or direct .pdf)
            const isDownload = /\.pdf(\?|$)/i.test(url) || /signature=|x-amz-signature=|x-goog-signature=/i.test(url);

            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 font-medium hover:underline underline-offset-2",
                  isDownload
                    ? "px-2.5 py-1 rounded-md bg-mint/15 text-mint hover:bg-mint/25 no-underline"
                    : "text-violet",
                )}
              >
                {isDownload ? <Download className="size-3.5" /> : null}
                {children}
                {isDownload ? null : <ExternalLink className="size-3" />}
              </a>
            );
          },
          // Compact markdown rendering for chat
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className: cn2 }) => {
            const isInline = !cn2;
            return isInline ? (
              <code className="px-1 py-0.5 rounded bg-muted/60 font-mono text-[12px]">{children}</code>
            ) : (
              <code className={cn("font-mono text-xs", cn2)}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 p-2.5 rounded-lg bg-muted/40 border border-border overflow-x-auto text-xs">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
          th: ({ children }) => <th className="px-2 py-1.5 text-left font-semibold border border-border">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1.5 border border-border">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-2 border-violet/40 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
