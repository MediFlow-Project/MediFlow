import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatTimeId } from "../utils/format";
import Button from "./Button";
import Alert from "./Alert";
import Avatar from "./Avatar";
import { IconCheck, IconChevron } from "./Icons";
import TypingBubble from "./TypingBubble";
import { emitChatTyping } from "../socket";

export default function ChatThread({
  appointmentId,
  counterpartName,
  counterpartImgUrl,
  messages,
  currentUserId,
  counterpartTyping,
  counterpartLastReadAt,
  counterpartLastReadMessageId,
  writable,
  closedHint,
  sending,
  error,
  onSend,
}) {
  const [body, setBody] = useState("");
  const listRef = useRef(null);
  const composerRef = useRef(null);
  const prevCountRef = useRef(0);
  const stickToBottomRef = useRef(true);
  const typingTimer = useRef(null);

  function fitComposer(el = composerRef.current) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const count = messages.length;
    const grew = count > prevCountRef.current;
    const firstLoad = prevCountRef.current === 0 && count > 0;
    prevCountRef.current = count;
    if (
      firstLoad ||
      (grew && stickToBottomRef.current) ||
      (counterpartTyping && stickToBottomRef.current)
    ) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, counterpartTyping]);

  useEffect(() => {
    return () => {
      if (appointmentId) emitChatTyping(appointmentId, false);
      clearTimeout(typingTimer.current);
    };
  }, [appointmentId]);

  function handleListScroll(event) {
    const el = event.currentTarget;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function handleChange(event) {
    setBody(event.target.value);
    fitComposer(event.target);
    if (!writable || !appointmentId) return;
    emitChatTyping(appointmentId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      emitChatTyping(appointmentId, false);
    }, 2000);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    onSend(text);
    setBody("");
    emitChatTyping(appointmentId, false);
    requestAnimationFrame(() => fitComposer());
  }

  function handleComposerKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSubmit(event);
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="mf-surface-ink flex shrink-0 items-center gap-3 px-3 py-3 text-white sm:px-5">
        <Link
          to="/pesan"
          aria-label="Kembali"
          className="inline-flex rounded-full p-1 text-white/80 transition hover:text-accent-light lg:hidden"
        >
          <IconChevron className="h-5 w-5 rotate-180" />
        </Link>
        <Avatar
          src={counterpartImgUrl}
          name={counterpartName}
          size="sm"
          className="ring-white/20"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-semibold leading-tight sm:text-xl">
            {counterpartName}
          </h2>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="mf-chat-wallpaper pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          ref={listRef}
          onScroll={handleListScroll}
          className="relative z-[1] h-full min-h-0 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
        >
        {messages.length === 0 && !counterpartTyping ? (
          <p className="mx-auto mt-10 w-fit rounded-sm bg-white/85 px-4 py-2 text-sm text-muted shadow-xs ring-1 ring-hairline">
            Belum ada pesan.
          </p>
        ) : (
          messages.map((item) => {
            const mine = Number(item.senderId) === Number(currentUserId);
            const read =
              mine &&
              Boolean(item.id) &&
              Boolean(
                item.read ||
                  (counterpartLastReadMessageId &&
                    Number(item.id) <= Number(counterpartLastReadMessageId))
              );
            const sent = mine && Boolean(item.id);
            return (
              <article
                key={item.id}
                className={`w-fit max-w-[85%] min-w-0 px-3 py-2 shadow-xs sm:px-3.5 sm:py-2.5 ${
                  mine
                    ? "ml-auto rounded-sm rounded-br-xs bg-primary text-white"
                    : "rounded-sm rounded-bl-xs border border-hairline bg-white text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">
                  {item.body}
                </p>
                <p
                  className={`mt-1.5 inline-flex items-center gap-1 text-[11px] ${
                    mine ? "text-white/60" : "text-muted"
                  }`}
                >
                  {formatTimeId(item.createdAt)}
                  {sent ? (
                    <span
                      className="inline-flex"
                      title={read ? "Dibaca" : "Terkirim"}
                      aria-label={read ? "Dibaca" : "Terkirim"}
                    >
                      <IconCheck className={`h-3 w-3 ${read ? "text-accent" : "opacity-80"}`} />
                      {read ? (
                        <IconCheck className="-ml-1.5 h-3 w-3 text-accent" />
                      ) : null}
                    </span>
                  ) : null}
                </p>
              </article>
            );
          })
        )}
        {counterpartTyping ? <TypingBubble /> : null}
        </div>
      </div>

      {error ? (
        <Alert className="mx-4 mb-1 shrink-0 sm:mx-5">{error}</Alert>
      ) : null}

      {writable ? (
        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 items-end gap-2 border-t border-hairline bg-white p-3 sm:p-4"
        >
          <label className="sr-only" htmlFor="chat-body">
            Tulis pesan
          </label>
          <textarea
            id="chat-body"
            ref={composerRef}
            rows={1}
            wrap="soft"
            value={body}
            onChange={handleChange}
            onKeyDown={handleComposerKeyDown}
            maxLength={1000}
            placeholder="Tulis pesan…"
            className="mf-input mt-0 max-h-40 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed"
          />
          <Button type="submit" loading={sending} disabled={!body.trim()}>
            Kirim
          </Button>
        </form>
      ) : (
        <p className="shrink-0 border-t border-hairline bg-accent-soft px-5 py-4 text-sm leading-relaxed text-ink">
          {closedHint || "Percakapan sudah ditutup."}
        </p>
      )}
    </section>
  );
}
