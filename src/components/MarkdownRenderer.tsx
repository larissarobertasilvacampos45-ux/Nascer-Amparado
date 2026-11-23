import React from "react";
import { normalizeSequentialNumbering } from "../utils/generateBirthPlanPdf";

interface MarkdownRendererProps {
  content: string;
  documentStyle?: boolean;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#2A1F24]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function MarkdownRenderer({
  content,
  documentStyle = false,
}: MarkdownRendererProps) {
  const normalizedContent = documentStyle
    ? normalizeSequentialNumbering(content)
    : content;
  const lines = normalizedContent.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listItems: { ordered: boolean; start: number; items: string[] } | null = null;
  let keyCounter = 0;

  const flushList = () => {
    if (!listItems) return;
    const current = listItems;
    listItems = null;
    if (current.ordered) {
      elements.push(
        <ol
          key={`list-${keyCounter++}`}
          start={current.start}
          className="my-3 space-y-2 pl-5 list-decimal text-[15px] leading-relaxed text-[#2A1F24] marker:text-[#B54B6E] marker:font-semibold"
        >
          {current.items.map((item, i) => (
            <li key={i} className="pl-1">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul
          key={`list-${keyCounter++}`}
          className="my-3 space-y-2 pl-5 list-disc text-[15px] leading-relaxed text-[#2A1F24] marker:text-[#D87093]"
        >
          {current.items.map((item, i) => (
            <li key={i} className="pl-1">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      flushList();
      elements.push(
        <hr
          key={`hr-${keyCounter++}`}
          className="my-5 border-t border-[#F2D7DF]"
        />
      );
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      if (level === 1) {
        elements.push(
          <h1
            key={`h1-${keyCounter++}`}
            className={`font-editorial font-semibold text-[#2A1F24] ${
              documentStyle
                ? "text-2xl mt-2 mb-4 pb-3 border-b border-[#F2D7DF]"
                : "text-xl mt-4 mb-2"
            }`}
          >
            {renderInlineFormatting(headingText)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={`h2-${keyCounter++}`}
            className="font-editorial text-lg font-semibold text-[#8E3352] mt-5 mb-2"
          >
            {renderInlineFormatting(headingText)}
          </h2>
        );
      } else {
        elements.push(
          <h3
            key={`h3-${keyCounter++}`}
            className="text-base font-semibold text-[#2A1F24] mt-4 mb-1.5"
          >
            {renderInlineFormatting(headingText)}
          </h3>
        );
      }
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (listItems && listItems.ordered) {
        flushList();
      }
      if (!listItems) {
        listItems = { ordered: false, start: 1, items: [] };
      }
      listItems.items.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      const num = parseInt(orderedMatch[1], 10);
      const itemText = orderedMatch[2];

      if (documentStyle && itemText.length <= 110) {
        flushList();
        elements.push(
          <h2
            key={`sec-${keyCounter++}`}
            className="font-editorial text-lg font-semibold text-[#8E3352] mt-5 mb-2"
          >
            <span className="mr-1.5">{num}.</span>
            {renderInlineFormatting(itemText)}
          </h2>
        );
        continue;
      }

      if (listItems && !listItems.ordered) {
        flushList();
      }
      if (!listItems) {
        listItems = {
          ordered: true,
          start: Number.isFinite(num) && num > 0 ? num : 1,
          items: [],
        };
      }
      listItems.items.push(itemText);
      continue;
    }

    flushList();
    elements.push(
      <p
        key={`p-${keyCounter++}`}
        className="my-2.5 text-[15px] leading-relaxed text-[#2A1F24]"
      >
        {renderInlineFormatting(line)}
      </p>
    );
  }

  flushList();

  return <div className="max-w-none">{elements}</div>;
}
