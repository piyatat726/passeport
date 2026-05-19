'use client';

/**
 * Lightweight Markdown renderer for PASSEPORT posts.
 * Supports: **bold**, *italic*, > blockquote, ## heading, [link](url), --- hr
 * No external dependencies.
 */

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let blockquoteLines: string[] = [];

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote
          key={`bq-${elements.length}`}
          className="border-l-2 border-taupe/40 pl-4 my-4 text-taupe italic font-noto"
        >
          {blockquoteLines.map((line, i) => (
            <p key={i}>{renderInline(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blockquote
    if (line.startsWith('> ')) {
      blockquoteLines.push(line.slice(2));
      continue;
    }
    flushBlockquote();

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(
        <hr key={`hr-${i}`} className="my-6 border-border" />
      );
      continue;
    }

    // Heading ##
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h-${i}`} className="font-playfair italic text-lg tracking-editorial text-ink mt-6 mb-2 normal-case">
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-3" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-ink/85 dark:text-ink/80 font-noto leading-[1.9] tracking-wide">
        {renderInline(line)}
      </p>
    );
  }
  flushBlockquote();

  return <div className={className}>{elements}</div>;
}

/**
 * Render inline markdown: **bold**, *italic*, [link](url)
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: *text*
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // Link: [text](url)
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch } : null,
      italicMatch ? { type: 'italic', match: italicMatch } : null,
      linkMatch ? { type: 'link', match: linkMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => (a!.match.index || 0) - (b!.match.index || 0));

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    const idx = first.match.index || 0;

    // Text before match
    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }

    if (first.type === 'bold') {
      parts.push(
        <strong key={key++} className="font-semibold text-ink">
          {first.match[1]}
        </strong>
      );
    } else if (first.type === 'italic') {
      parts.push(
        <em key={key++} className="italic font-playfair">
          {first.match[1]}
        </em>
      );
    } else if (first.type === 'link') {
      parts.push(
        <a
          key={key++}
          href={first.match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8B7355] underline underline-offset-2 decoration-[#8B7355]/30 hover:decoration-[#8B7355]"
        >
          {first.match[1]}
        </a>
      );
    }

    remaining = remaining.slice(idx + first.match[0].length);
  }

  return parts.length === 1 ? parts[0] : parts;
}
