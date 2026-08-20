import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../store/notificationsSlice";
import {
  IconAlert,
  IconBell,
  IconCalendar,
  IconCheck,
  IconInfo,
  IconReceipt,
} from "./Icons";

const TONES = {
  queue_called: { mark: "bg-mist text-primary", Icon: IconBell, label: "Antrean" },
  session_opened: { mark: "bg-mist text-primary", Icon: IconCalendar, label: "Sesi" },
  booking_created: { mark: "bg-moss/10 text-moss", Icon: IconCheck, label: "Kunjungan" },
  invoice_paid: { mark: "bg-moss/10 text-moss", Icon: IconCheck, label: "Pembayaran" },
  invoice_created: { mark: "bg-surface text-ink", Icon: IconReceipt, label: "Tagihan" },
  queue_skipped: { mark: "bg-clay/10 text-danger", Icon: IconAlert, label: "Antrean" },
  appointment_cancelled: { mark: "bg-clay/10 text-danger", Icon: IconAlert, label: "Kunjungan" },
  invoice_failed: { mark: "bg-clay/10 text-danger", Icon: IconAlert, label: "Tagihan" },
  invoice_expired: { mark: "bg-clay/10 text-danger", Icon: IconAlert, label: "Tagihan" },
};

const FALLBACK = { mark: "bg-surface text-ink", Icon: IconInfo, label: "Info" };

function formatWhen(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Baru saja";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} mnt lalu`;
  if (diff < 86_400_000) {
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(item) {
    if (!item.readAt && item.id) {
      dispatch(markNotificationRead(item.id));
    }
    setOpen(false);
    if (item.href) navigate(item.href);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-sm border bg-white text-ink transition duration-200 ease-soft ${
          open ? "border-primary/40 bg-mist" : "border-hairline hover:border-primary/30"
        }`}
        aria-label={
          unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Notifikasi"
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <IconBell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-sm bg-primary px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(23.5rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-hairline bg-white shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Notifikasi</p>
              <p className="text-xs text-muted">
                {unreadCount > 0
                  ? `${unreadCount} belum dibaca`
                  : "Semua sudah dibaca"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="shrink-0 rounded-sm px-2 py-1 text-xs font-semibold text-primary transition hover:bg-mist"
                onClick={() => dispatch(markAllNotificationsRead())}
              >
                Tandai dibaca
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-surface text-muted">
                  <IconBell className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-ink">Belum ada notifikasi</p>
                <p className="mt-1 text-xs text-muted">
                  Pemanggilan antrean dan tagihan akan muncul di sini.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const tone = TONES[item.type] || FALLBACK;
                const { Icon } = tone;
                const unread = !item.readAt;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`relative flex w-full items-start gap-3 border-b border-hairline px-4 py-3 text-left transition last:border-b-0 hover:bg-mist/60 ${
                      unread ? "bg-mist/35" : "bg-white"
                    }`}
                    onClick={() => openItem(item)}
                  >
                    {unread ? (
                      <span
                        className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${tone.mark}`}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-ink">{item.title}</span>
                        <span className="shrink-0 text-[11px] text-muted">
                          {formatWhen(item.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted">
                        {item.message}
                      </span>
                      <span className="mt-1.5 block text-[0.7rem] font-semibold text-primary">
                        {tone.label}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
