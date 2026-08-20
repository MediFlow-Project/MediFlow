import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { http } from "../api/http";
import { formatTimeId, getErrorMessage, sessionLabel } from "../utils/format";
import { HOSPITAL } from "../data/hospital";
import Button from "./Button";
import Alert from "./Alert";
import Avatar from "./Avatar";
import { IconArrow, IconChat, IconClose, IconSparkle } from "./Icons";
import TypingBubble from "./TypingBubble";

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatbotWidget() {
  const { pathname } = useLocation();
  const { token, user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const composerRef = useRef(null);

  const role = user?.role;
  const hidden =
    pathname.startsWith("/pesan") || role === "doctor" || role === "admin";
  const canAsk = Boolean(token && role === "patient");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => composerRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, canAsk]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  if (hidden) return null;

  function fitComposer(el = composerRef.current) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading || !canAsk) return;

    setMessage("");
    setError("");
    requestAnimationFrame(() => fitComposer());
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", body: text, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);

    try {
      const { data } = await http.post("/chatbot/recommend", { message: text });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          body: data.reply,
          recommendations: data.recommendations || [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    setMessage(event.target.value);
    fitComposer(event.target);
  }

  function handleKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSubmit(event);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Konsultasi awal"
          className="pointer-events-auto flex h-[min(36rem,calc(100svh-7.5rem))] w-[min(24rem,calc(100vw-1.75rem))] flex-col overflow-hidden rounded-lg border border-hairline bg-paper shadow-2xl ring-1 ring-primary/10"
        >
          <header className="mf-surface-navy flex shrink-0 items-center gap-3 px-3 py-3 text-white sm:px-4">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold ring-1 ring-gold/35"
              aria-hidden="true"
            >
              <IconSparkle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl font-medium leading-tight">
                Konsultasi awal
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-sm p-1 text-white/70 transition hover:text-gold"
              aria-label="Tutup konsultasi awal"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </header>

          <div className="relative min-h-0 flex-1">
            <div className="mf-chat-wallpaper pointer-events-none absolute inset-0" aria-hidden="true" />
            <div
              ref={listRef}
              className="relative z-[1] h-full min-h-0 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5"
            >
            <p className="text-center text-[12px] leading-relaxed text-muted">
              Bukan pengganti opini dokter dan bukan gawat darurat. IGD 24 jam{" "}
              {HOSPITAL.igd}.
            </p>

            {!canAsk ? (
              <div className="rounded-md border border-hairline bg-white p-4">
                <p className="text-sm leading-relaxed text-ink">
                  Masuk sebagai pasien untuk menceritakan keluhan dan mendapat
                  arahan poli.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/login"
                    state={{ from: pathname }}
                    onClick={() => setOpen(false)}
                    className="inline-flex rounded-sm bg-primary px-3.5 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    state={{ from: pathname }}
                    onClick={() => setOpen(false)}
                    className="inline-flex rounded-sm border border-line bg-white px-3.5 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-primary"
                  >
                    Daftar
                  </Link>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                Ceritakan keluhan Anda. Saya bantu arahkan ke poli yang sesuai.
              </p>
            ) : (
              messages.map((item) => {
                const mine = item.role === "user";
                return (
                  <div key={item.id} className="space-y-3">
                    <article
                      className={`w-fit max-w-[85%] min-w-0 px-3 py-2 shadow-xs sm:px-3.5 sm:py-2.5 ${
                        mine
                          ? "ml-auto rounded-md rounded-br-xs bg-primary text-white"
                          : "rounded-md rounded-bl-xs border border-hairline bg-white text-ink"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">
                        {item.body}
                      </p>
                      <p
                        className={`mt-1.5 text-[11px] ${
                          mine ? "text-white/60" : "text-muted"
                        }`}
                      >
                        {formatTimeId(item.createdAt)}
                      </p>
                    </article>

                    {(item.recommendations || []).length === 0 &&
                    item.role === "assistant" &&
                    item.body ? (
                      <Link
                        to="/layanan#poliklinik"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-bronze"
                      >
                        Lihat poliklinik
                        <IconArrow className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}

                    {(item.recommendations || []).map((rec) => (
                      <article
                        key={rec.doctorId}
                        className="flex gap-3 rounded-md border border-hairline bg-white p-3"
                      >
                        <Avatar
                          src={rec.imgUrl}
                          name={rec.doctorName}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-bronze">
                            {rec.specialtyName}
                          </p>
                          <h3 className="mt-0.5 truncate font-display text-lg font-medium text-primary">
                            {rec.doctorName}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {rec.reason}
                          </p>
                          {rec.nextSession ? (
                            <p className="mt-1.5 text-[11px] font-medium text-ink">
                              {rec.nextSession.date} ·{" "}
                              {sessionLabel(rec.nextSession.session)}
                            </p>
                          ) : null}
                          <Link
                            to={`/daftar-dokter/${rec.doctorId}`}
                            onClick={() => setOpen(false)}
                            className="mt-2 inline-flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-bronze"
                          >
                            Buka profil
                            <IconArrow className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                );
              })
            )}
            {loading ? <TypingBubble /> : null}
            </div>
          </div>

          {error ? (
            <Alert className="mx-4 mb-1 shrink-0">{error}</Alert>
          ) : null}

          {canAsk ? (
            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 items-end gap-2 border-t border-hairline bg-white p-3 sm:p-4"
            >
              <label className="sr-only" htmlFor="chatbot-widget-message">
                Tulis keluhan
              </label>
              <textarea
                id="chatbot-widget-message"
                ref={composerRef}
                rows={1}
                wrap="soft"
                maxLength={1000}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Tulis keluhan…"
                className="mf-input mt-0 max-h-40 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed"
              />
              <Button type="submit" loading={loading} disabled={!message.trim()}>
                Kirim
              </Button>
            </form>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Tutup konsultasi awal" : "Buka konsultasi awal"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold shadow-xl ring-2 ring-gold/40 transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary-hover hover:ring-gold"
      >
        {open ? (
          <IconClose className="h-5 w-5" />
        ) : (
          <IconChat className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
