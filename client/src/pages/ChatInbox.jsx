import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchInbox } from "../store/chatSlice";
import { canWriteChat, formatDateId, formatTimeId, sessionLabel } from "../utils/format";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import StatusBadge from "../components/StatusBadge";

export default function ChatInbox() {
  const dispatch = useDispatch();
  const { inbox, inboxStatus } = useSelector((state) => state.chat);

  useEffect(() => {
    dispatch(fetchInbox());
  }, [dispatch]);

  if (inboxStatus === "loading" && inbox.length === 0) return <Loading />;

  const threads = [...inbox].sort((a, b) => {
    if ((b.unreadCount || 0) !== (a.unreadCount || 0)) return (b.unreadCount || 0) - (a.unreadCount || 0);
    const aTime = a.lastMessage?.createdAt || a.date || "";
    const bTime = b.lastMessage?.createdAt || b.date || "";
    return String(bTime).localeCompare(String(aTime));
  });

  return (
    <div>
      <PageHeader
        eyebrow="Chat"
        title="Pesan"
        description="Chat dibuka setelah konsultasi selesai, sampai H+1. Satu thread per janji temu."
      />
      {threads.length === 0 ? (
        <EmptyState title="Belum ada percakapan" hint="Thread muncul otomatis setelah booking." />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread.appointmentId}
              to={`/pesan/${thread.appointmentId}`}
              className="mf-card flex items-start justify-between gap-4 p-5 transition hover:border-primary/25"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-medium text-ink">{thread.counterpartName}</h2>
                  <StatusBadge status={thread.status} />
                  {thread.unreadCount > 0 ? (
                    <span className="rounded-full bg-amber px-2 py-0.5 text-[11px] font-bold text-white">
                      {thread.unreadCount} baru
                    </span>
                  ) : null}
                  {canWriteChat(thread) || thread.writable ? (
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-bold text-primary">
                      Terbuka
                    </span>
                  ) : (
                    <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-muted">
                      {thread.status === "completed" ? "Ditutup" : "Setelah konsul"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatDateId(thread.date)} · {sessionLabel(thread.session)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-ink/80">
                  {thread.lastMessage?.body || "Belum ada pesan."}
                </p>
              </div>
              {thread.lastMessage?.createdAt ? (
                <p className="shrink-0 text-xs font-semibold text-muted">
                  {formatTimeId(thread.lastMessage.createdAt)}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
