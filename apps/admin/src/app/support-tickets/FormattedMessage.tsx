'use client';

import React from 'react';

type Props = {
  content: string;
  className?: string;
};

export function FormattedMessage({ content, className = '' }: Props) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed break-words ${className}`}>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-2" />;
        }

        const formattedLine = parseLine(line);

        return (
          <p key={lineIdx} className="m-0">
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
}

function parseLine(text: string): React.ReactNode[] {
  const pattern =
    /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_\-]+)|(`[^`]+`)|(\*\*[^*]+\*\*)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const matchedStr = match[0];

    if (match[1]) {
      nodes.push(
        <a
          key={`url-${match.index}`}
          href={matchedStr}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-amber-400 hover:text-amber-300 font-medium break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedStr}
        </a>
      );
    } else if (match[2]) {
      nodes.push(
        <span
          key={`mention-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md font-semibold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30"
        >
          {matchedStr}
        </span>
      );
    } else if (match[3]) {
      const codeText = matchedStr.slice(1, -1);
      nodes.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-black/40 font-mono text-[11px] text-amber-200 border border-amber-900/40"
        >
          {codeText}
        </code>
      );
    } else if (match[4]) {
      const boldText = matchedStr.slice(2, -2);
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-bold text-white">
          {boldText}
        </strong>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
