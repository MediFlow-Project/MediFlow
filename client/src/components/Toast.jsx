import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { IconAlert, IconChat, IconCheck, IconClose, IconInfo } from "./Icons";

const TONES = {
  error: {
    box: "bg-paper-raised text-ink ring-1 ring-danger/20",
    accent: "bg-danger",
    mark: "bg-danger/10 text-danger",
    progress: "bg-danger",
    kicker: "text-danger",
    kickerLabel: "Gagal",
    message: "text-ink/80",
    close: "text-muted hover:bg-danger/10 hover:text-danger",
    Icon: IconAlert,
  },
  success: {
    box: "bg-paper-raised text-ink ring-1 ring-gold/35",
    accent: "bg-gold",
    mark: "bg-gold-soft text-bronze",
    progress: "bg-gold",
    kicker: "text-bronze",
    kickerLabel: "Berhasil",
    message: "text-ink/80",
    close: "text-muted hover:bg-sand hover:text-ink",
    Icon: IconCheck,
  },
  chat: {
    box: "bg-primary text-white ring-1 ring-gold/40",
    accent: "bg-gold",
    mark: "bg-gold/20 text-gold",
    progress: "bg-gold",
    kicker: "text-gold",
    kickerLabel: "Pesan baru",
    message: "text-white/80",
    close: "text-white/55 hover:bg-white/10 hover:text-white",
    Icon: IconChat,
  },
  info: {
    box: "bg-paper-raised text-ink ring-1 ring-primary/15",
    accent: "bg-primary",
    mark: "bg-mist text-primary",
    progress: "bg-primary",
    kicker: "text-primary",
    kickerLabel: "Info",
    message: "text-ink/80",
    close: "text-muted hover:bg-mist hover:text-ink",
    Icon: IconInfo,
  },
};

function chatHref(toast) {
  if (toast?.href) return toast.href;
  if (toast?.to) return toast.to;
  if (toast?.appointmentId) return `/pesan/${toast.appointmentId}`;
  if (toast?.type === "chat") return "/pesan";
  return null;
}

export default function Toast() {
  const { toast, hideToast } = useToast();
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPaused(false);
  }, [toast]);

  useEffect(() => {
    if (!toast || paused) return undefined;
    const timer = setTimeout(() => hideToast(), 8000);
    return () => clearTimeout(timer);
  }, [toast, paused, hideToast]);

  if (!toast) return null;

  const tone = TONES[toast.type] || TONES.info;
  const { Icon } = tone;
  const href = chatHref(toast);
  const title = toast.title || null;
  const toastKey = `${toast.type}-${title || ""}-${toast.message}-${href || ""}`;

  function openTarget(event) {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (!href) return;
    navigate(href);
    hideToast();
  }

  function dismiss(event) {
    event.preventDefault();
    event.stopPropagation();
    hideToast();
  }

  const body = (
    <>
      <span
        className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.mark}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${tone.kicker}`}
        >
          {tone.kickerLabel}
        </p>
        {title ? (
          <p className="mt-1 text-base font-semibold leading-snug tracking-tight">
            {title}
          </p>
        ) : null}
        <p
          className={`${title ? "mt-0.5 text-sm leading-relaxed" : "mt-1 text-[15px] font-medium leading-snug"} ${tone.message}`}
        >
          {toast.message}
        </p>
        {href ? (
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
            {toast.type === "chat" ? "Buka percakapan" : "Lihat detail"}
          </p>
        ) : null}
      </div>
    </>
  );

  const boxClass = `mf-toast-enter relative overflow-hidden rounded-lg text-left shadow-xl ${tone.box}`;

  const node = (
    <div
      className="fixed z-[2147483647] w-[min(27rem,calc(100vw-1.5rem))]"
      style={{ top: 20, right: 20, pointerEvents: "auto" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={boxClass}>
        <span
          className={`absolute inset-y-0 left-0 w-1 ${tone.accent}`}
          aria-hidden="true"
        />
        {href ? (
          <button
            type="button"
            className="flex w-full cursor-pointer items-start gap-3.5 py-4 pr-12 pl-5 text-left"
            aria-label={
              toast.type === "chat"
                ? `Buka percakapan dengan ${title || "pengirim"}`
                : toast.title || toast.message || "Lihat detail"
            }
            onPointerDown={openTarget}
          >
            {body}
          </button>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="flex w-full items-start gap-3.5 py-4 pr-12 pl-5"
          >
            {body}
          </div>
        )}
        <button
          type="button"
          className={`absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${tone.close}`}
          aria-label="Tutup notifikasi"
          onPointerDown={dismiss}
        >
          <IconClose className="h-4 w-4" />
        </button>
        <span
          key={toastKey}
          className={`mf-toast-progress absolute right-0 bottom-0 left-0 h-0.5 origin-left ${tone.progress} ${paused ? "is-paused" : ""}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
