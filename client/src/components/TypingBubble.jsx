export function TypingDots({ className = "", dotClassName = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] ${className}`}
      aria-hidden="true"
    >
      <span className={`mf-typing-dot ${dotClassName}`} />
      <span className={`mf-typing-dot ${dotClassName}`} />
      <span className={`mf-typing-dot ${dotClassName}`} />
    </span>
  );
}

export default function TypingBubble() {
  return (
    <article
      role="status"
      aria-label="Sedang mengetik"
      className="w-fit rounded-sm rounded-bl-xs border border-hairline bg-white px-3.5 py-3 shadow-xs"
    >
      <TypingDots className="text-muted" />
    </article>
  );
}
