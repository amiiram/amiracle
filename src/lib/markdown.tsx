import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer for long-form project copy.
 *
 * It supports the subset the project form encourages (headings, paragraphs,
 * lists, quotes, fenced code, images, links, and inline emphasis) and renders
 * to React elements instead of HTML strings, so arbitrary raw HTML is never
 * interpreted and every text node is escaped by React.
 *
 * URL policy for links and images: `http(s)://` external URLs and
 * application-relative paths starting with a single `/`. Anything else
 * (including `javascript:`, `data:`, protocol-relative, and filesystem-ish
 * values) renders as plain text without an href/src.
 *
 * Controlled video syntax (documented choice): standard Markdown has no
 * native video element, and raw HTML authoring is forbidden here. A video is
 * therefore written with the ordinary image syntax whose URL ends in a
 * supported video extension:
 *
 *   ![Demo](/media/projects/video-platform/demo.mp4)
 *
 * The renderer detects the `.mp4` / `.webm` / `.mov` extension (ignoring any
 * query string or fragment) and emits a controlled `<video controls
 * preload="metadata">` element through the same safe-URL policy. Everything
 * else using image syntax renders as `<img>`. The stored value stays portable
 * plain-text Markdown and arbitrary HTML is never executed.
 */

const IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)\)/;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^)\s]+)\)/;
const BOLD_PATTERN = /^\*\*([^*]+)\*\*/;
const ITALIC_PATTERN = /^\*([^*]+)\*/;
const UNDERLINE_ITALIC_PATTERN = /^_([^_]+)_/;
const CODE_PATTERN = /^`([^`]+)`/;
const INLINE_PATTERNS = [
  IMAGE_PATTERN,
  LINK_PATTERN,
  BOLD_PATTERN,
  ITALIC_PATTERN,
  UNDERLINE_ITALIC_PATTERN,
  CODE_PATTERN,
];

/** True when a Markdown media URL points at a playable video file. */
function isVideoUrl(url: string) {
  return /\.(?:mp4|webm|mov)(?:[?#].*)?$/i.test(url.trim());
}

function toSafeUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);

      return parsed.protocol === "http:" || parsed.protocol === "https:"
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buffer = "";
  let position = 0;
  let index = 0;

  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  while (position < text.length) {
    const remaining = text.slice(position);
    const pattern = INLINE_PATTERNS.find((candidate) =>
      candidate.test(remaining),
    );

    if (!pattern) {
      buffer += text[position];
      position += 1;
      continue;
    }

    const match = remaining.match(pattern);

    if (!match) {
      buffer += text[position];
      position += 1;
      continue;
    }

    const key = `${keyPrefix}-${index}`;

    index += 1;

    if (pattern === IMAGE_PATTERN) {
      const href = toSafeUrl(match[2]);

      if (href) {
        flush();

        if (isVideoUrl(match[2])) {
          nodes.push(
            <video
              key={key}
              src={href}
              controls
              preload="metadata"
              aria-label={match[1] || "Project video"}
            />,
          );
        } else {
          nodes.push(
            // eslint-disable-next-line @next/next/no-img-element -- markdown media paths are plain static assets, not optimized routes
            <img key={key} src={href} alt={match[1]} loading="lazy" />,
          );
        }
      } else {
        flush();
        nodes.push(<em key={key}>{match[1]}</em>);
      }
    } else if (pattern === LINK_PATTERN) {
      const href = toSafeUrl(match[2]);

      if (href) {
        flush();
        nodes.push(
          <a key={key} href={href} rel="noreferrer">
            {renderInline(match[1], key)}
          </a>,
        );
      } else {
        flush();
        nodes.push(<span key={key}>{match[1]}</span>);
      }
    } else if (pattern === BOLD_PATTERN) {
      flush();
      nodes.push(<strong key={key}>{renderInline(match[1], key)}</strong>);
    } else if (
      pattern === ITALIC_PATTERN ||
      pattern === UNDERLINE_ITALIC_PATTERN
    ) {
      flush();
      nodes.push(<em key={key}>{renderInline(match[1], key)}</em>);
    } else {
      flush();
      nodes.push(<code key={key}>{match[1]}</code>);
    }

    position += match[0].length;
  }

  flush();

  return nodes;
}

type MarkdownRenderOptions = {
  headingOffset?: 0 | 1;
  lineBreaks?: boolean;
};

function renderParagraph(
  lines: string[],
  key: string,
  options: MarkdownRenderOptions,
): ReactNode {
  if (options.lineBreaks) {
    return (
      <p key={key}>
        {lines.map((line, index) => (
          <Fragment key={`${key}-${index}`}>
            {index > 0 ? <br /> : null}
            {renderInline(line.trim(), `${key}-${index}`)}
          </Fragment>
        ))}
      </p>
    );
  }

  const merged = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  return <p key={key}>{renderInline(merged, key)}</p>;
}

/**
 * Renders a Markdown string into safe React elements. Usable from server and
 * client components; it performs no I/O and holds no state.
 */
export function renderMarkdown(
  markdown: string,
  options: MarkdownRenderOptions = {},
): ReactNode {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let listItems: Array<{ ordered: boolean; text: string }> = [];
  let quoteLines: string[] = [];
  let codeLines: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(renderParagraph(paragraph, `p-${blocks.length}`, options));
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const ordered = listItems[0].ordered;
      const items = listItems.map((item, itemIndex) => (
        <li key={`li-${blocks.length}-${itemIndex}`}>
          {renderInline(item.text, `li-${blocks.length}-${itemIndex}`)}
        </li>
      ));

      blocks.push(
        ordered ? (
          <ol key={`ol-${blocks.length}`}>{items}</ol>
        ) : (
          <ul key={`ul-${blocks.length}`}>{items}</ul>
        ),
      );
      listItems = [];
    }
  };

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      blocks.push(
        <blockquote key={`q-${blocks.length}`}>
          {renderParagraph(quoteLines, `q-${blocks.length}`, options)}
        </blockquote>,
      );
      quoteLines = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (codeLines !== null) {
      if (/^```/.test(line.trim())) {
        blocks.push(
          <pre key={`pre-${blocks.length}`}>
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
        codeLines = null;
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    if (/^```/.test(line.trim())) {
      flushAll();
      codeLines = [];
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);

    if (heading) {
      flushAll();

      const level = heading[1].length + (options.headingOffset ?? 0);
      const content = renderInline(heading[2].trim(), `h-${blocks.length}`);
      const key = `h-${blocks.length}`;

      if (level === 1) {
        blocks.push(<h1 key={key}>{content}</h1>);
      } else if (level === 2) {
        blocks.push(<h2 key={key}>{content}</h2>);
      } else if (level === 3) {
        blocks.push(<h3 key={key}>{content}</h3>);
      } else if (level === 4) {
        blocks.push(<h4 key={key}>{content}</h4>);
      } else if (level === 5) {
        blocks.push(<h5 key={key}>{content}</h5>);
      }

      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      listItems.push({
        ordered: Boolean(numbered),
        text: (bullet ?? numbered)![1],
      });
      continue;
    }

    const quoted = line.match(/^\s*>\s?(.*)$/);

    if (quoted) {
      flushParagraph();
      flushList();
      quoteLines.push(quoted[1]);
      continue;
    }

    if (listItems.length > 0) {
      // A plain line inside a list continues the previous item.
      const last = listItems[listItems.length - 1];

      last.text = `${last.text} ${line.trim()}`;
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  if (codeLines !== null) {
    blocks.push(
      <pre key={`pre-${blocks.length}`}>
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
  }

  flushAll();

  return blocks;
}
