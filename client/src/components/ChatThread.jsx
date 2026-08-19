import { useEffect, useRef, useState } from "react";
import { formatTimeId } from "../utils/format";
import Button from "./Button";
import { emitChatTyping } from "../socket";

export default function ChatThread({
  appointmentId,
  counterpartName,
  messages,
  currentUserId,
  counterpartTyping,
  counterpartLastReadAt,
  writable,
  closedHint,
  sending,
  error,
  onSend,
}) {
  const [body, setBody] = useState("");
  const listRef = useRef(null);
  const prevCountRef = useRef(0);
  const stickToBottomRef = useRef(true);
  const typingTimer = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const count = messages.length;
    const grew = count > prevCountRef.current;
    const firstLoad = prevCountRef.current === 0 && count > 0;
    prevCountRef.current = count;
    if (firstLoad || (grew && stickToBottomRef.current)) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (appointmentId) emitChatTyping(appointmentId, false);
      clearTimeout(typingTimer.current);
    };
  }, [appointmentId]);

  function handleListScroll(event) {
    const el = event.currentTarget;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function handleChange(event) {
    setBody(event.target.value);
    if (!writable || !appointmentId) return;
    emitChatTyping(appointmentId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      emitChatTyping(appointmentId, false);
    }, 800);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    onSend(text);
    setBody("");
    emitChatTyping(appointmentId, false);
  }

  const myLastId = [...messages].reverse().find((item) => item.senderId === currentUserId)?.id;

  return (
    <section className="mf-card flex min-h-[28rem] flex-col overflow-hidden">
      <header className="border-b border-line px-5 py-4">
        <p className="mf-kicker">Thread chat</p>
        <h2 className="mt-1 font-display text-2xl font-medium text-ink">{counterpartName}</h2>
        <p
          className={`mt-1 text-sm font-semibold text-primary ${
            counterpartTyping ? "visible" : "invisible"
          }`}
        >
          {counterpartName} sedang mengetik…
        </p>
      </header>
      <div
        ref={listRef}
        onScroll={handleListScroll}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            {writable ? "Belum ada pesan. Mulai percakapan." : "Belum ada pesan."}
          </p>
        ) : (
          messages.map((item) => {
            const mine = item.senderId === currentUserId;
            const showRead =
              mine &&
              item.id === myLastId &&
              counterpartLastReadAt &&
              new Date(counterpartLastReadAt) >= new Date(item.createdAt);
            return (
              <article
                key={item.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine ? "ml-auto bg-primary text-white" : "bg-sand text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>
                  {formatTimeId(item.createdAt)}
                  {showRead ? " · Dibaca" : ""}
                </p>
              </article>
            );
          })
        )}
      </div>
      {error ? <p className="px-5 text-sm font-semibold text-danger">{error}</p> : null}
      {writable ? (
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3 sm:p-4">
          <label className="sr-only" htmlFor="chat-body">
            Tulis pesan
          </label>
          <input
            id="chat-body"
            value={body}
            onChange={handleChange}
            maxLength={1000}
            placeholder="Tulis pesan…"
            className="mf-input mt-0 flex-1"
          />
          <Button type="submit" disabled={sending || !body.trim()}>
            Kirim
          </Button>
        </form>
      ) : (
        <p className="border-t border-line px-5 py-4 text-sm text-muted">
          {closedHint || "Chat sudah ditutup. Riwayat tetap bisa dibaca."}
        </p>
      )}
    </section>
  );
}
