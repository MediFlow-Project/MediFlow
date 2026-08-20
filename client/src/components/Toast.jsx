import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { IconAlert, IconArrow, IconChat, IconCheck, IconClose, IconInfo } from "./Icons";

const TONES = {
  error: {
    box: "bg-white text-ink ring-1 ring-danger/15",
    accent: "bg-danger",
    mark: "bg-clay/10 text-danger",
    progress: "bg-danger",
    track: "bg-danger/10",
    kicker: "text-danger",
    kickerLabel: "Gagal",
    message: "text-muted",
    cta: "text-danger",
    close: "text-muted hover:bg-clay/10 hover:text-danger",
    Icon: IconAlert,
  },
  success: {
    box: "bg-white text-ink ring-1 ring-moss/20",
    accent: "bg-moss",
    mark: "bg-moss/10 text-moss",
    progress: "bg-moss",
    track: "bg-moss/10",
    kicker: "text-moss",
    kickerLabel: "Berhasil",
    message: "text-muted",
    cta: "text-primary",
    close: "text-muted hover:bg-mist hover:text-ink",
    Icon: IconCheck,
  },
  chat: {
    box: "bg-white text-ink ring-1 ring-primary/15",
    accent: "bg-primary",
    mark: "bg-mist text-primary",
    progress: "bg-primary",
    track: "bg-primary/10",
    kicker: "text-primary",
    kickerLabel: "Pesan baru",
    message: "text-muted",
    cta: "text-primary",
    close: "text-muted hover:bg-mist hover:text-ink",
    Icon: IconChat,
  },
  info: {
    box: "bg-white text-ink ring-1 ring-ink/8",
    accent: "bg-ink",
    mark: "bg-surface text-ink",
    progress: "bg-ink",
    track: "bg-ink/10",
    kicker: "text-ink",
    kickerLabel: "Pemberitahuan",
    message: "text-muted",
    cta: "text-primary",
    close: "text-muted hover:bg-surface hover:text-ink",
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

function ToastCard({ toast, hideToast }) {
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const tone = TONES[toast.type] || TONES.info;
  const { Icon } = tone;
  const href = chatHref(toast);
  const title = toast.title || null;
  const heading = title || toast.message;
  const detail = title ? toast.message : null;
  const ctaLabel = toast.type === "chat" ? "Buka percakapan" : "Lihat detail";

  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => hideToast(), 8000);
    return () => clearTimeout(timer);
  }, [paused, hideToast]);

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
        className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${tone.mark}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[0.72rem] font-semibold ${tone.kicker}`}>
          {tone.kickerLabel}
        </p>
        <p className="mt-0.5 text-[0.95rem] font-semibold leading-snug text-ink">
          {heading}
        </p>
        {detail ? (
          <p className={`mt-1 text-sm leading-relaxed ${tone.message}`}>{detail}</p>
        ) : null}
        {href ? (
          <p className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${tone.cta}`}>
            {ctaLabel}
            <IconArrow className="h-3.5 w-3.5" />
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      className="pointer-events-auto fixed top-4 right-4 z-[2147483647] w-[min(24.5rem,calc(100vw-1.5rem))]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`mf-toast-enter relative overflow-hidden rounded-sm text-left shadow-lg ${tone.box}`}
      >
        <span
          className={`absolute inset-y-0 left-0 w-1 ${tone.accent}`}
          aria-hidden="true"
        />
        {href ? (
          <button
            type="button"
            className="flex w-full cursor-pointer items-start gap-3 py-3.5 pr-11 pl-4 text-left"
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
            className="flex w-full items-start gap-3 py-3.5 pr-11 pl-4"
          >
            {body}
          </div>
        )}
        <button
          type="button"
          className={`absolute top-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${tone.close}`}
          aria-label="Tutup notifikasi"
          onPointerDown={dismiss}
        >
          <IconClose className="h-4 w-4" />
        </button>
        <span className={`absolute right-0 bottom-0 left-0 h-1 ${tone.track}`} aria-hidden="true">
          <span
            className={`mf-toast-progress block h-full origin-left ${tone.progress} ${
              paused ? "is-paused" : ""
            }`}
          />
        </span>
      </div>
    </div>
  );
}

export default function Toast() {
  const { toast, hideToast } = useToast();
  if (!toast) return null;

  const key = `${toast.type}-${toast.title || ""}-${toast.message}-${
    toast.href || toast.to || toast.appointmentId || ""
  }`;

  return createPortal(
    <ToastCard key={key} toast={toast} hideToast={hideToast} />,
    document.body
  );
}
