import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../store/notificationsSlice";
import { IconBell } from "./Icons";

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
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-sm border border-hairline bg-white text-ink shadow-xs transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
        aria-label={
          unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Notifikasi"
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <IconBell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-dark">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-hairline bg-paper-raised shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary">
              Notifikasi
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-[11px] font-semibold text-bronze transition hover:text-primary"
                onClick={() => dispatch(markAllNotificationsRead())}
              >
                Tandai dibaca
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Belum ada notifikasi.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full flex-col gap-0.5 border-b border-hairline px-4 py-3 text-left transition hover:bg-mist/70 ${
                    item.readAt ? "bg-white" : "bg-gold-soft/40"
                  }`}
                  onClick={() => openItem(item)}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {formatWhen(item.createdAt)}
                    </span>
                  </span>
                  <span className="text-sm leading-snug text-muted">{item.message}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
