import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { TerminalCodeCard } from "./TerminalCodeCard";
import "./MarkdownRenderer.css";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`rufus-markdown-container ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }: any) {
            return <>{children}</>;
          },
          code({ className: codeClass, children, ...props }: any) {
            const match = /language-(\w+)/.exec(codeClass || "");
            const rawText = String(children || "");
            const hasMultipleLines = rawText.includes("\n");

            // Treat as inline code only if there is no explicit language class and single-line
            if (!match && !hasMultipleLines) {
              return (
                <code className="markdown-inline-code" {...props}>
                  {children}
                </code>
              );
            }

            const lang = match ? match[1] : "text";
            const cleanCode = rawText.replace(/\n$/, "");
            return <TerminalCodeCard language={lang} code={cleanCode} />;
          },
          table({ children, ...props }: any) {
            return (
              <div className="markdown-table-wrapper">
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          blockquote({ children, ...props }: any) {
            return (
              <blockquote className="markdown-blockquote" {...props}>
                <div className="blockquote-accent-pill" />
                <div className="blockquote-body">{children}</div>
              </blockquote>
            );
          },
          a({ href, children, ...props }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            );
          },
          ul({ children, ...props }: any) {
            return (
              <ul className="markdown-list markdown-ul" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }: any) {
            return (
              <ol className="markdown-list markdown-ol" {...props}>
                {children}
              </ol>
            );
          },
          h1({ children, ...props }: any) {
            return <h1 className="markdown-heading markdown-h1" {...props}>{children}</h1>;
          },
          h2({ children, ...props }: any) {
            return <h2 className="markdown-heading markdown-h2" {...props}>{children}</h2>;
          },
          h3({ children, ...props }: any) {
            return <h3 className="markdown-heading markdown-h3" {...props}>{children}</h3>;
          },
          p({ children, ...props }: any) {
            return <p className="markdown-paragraph" {...props}>{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
