import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchInbox } from "../store/chatSlice";
import { formatTimeId } from "../utils/format";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Avatar from "../components/Avatar";
import { IconChat } from "../components/Icons";
import { TypingDots } from "../components/TypingBubble";

export default function ChatInbox() {
  const dispatch = useDispatch();
  const { appointmentId: paramId } = useParams();
  const { pathname } = useLocation();
  const appointmentId = paramId || pathname.match(/^\/pesan\/(\d+)/)?.[1];
  const { inbox, inboxStatus } = useSelector((state) => state.chat);
  const hasThread = Boolean(appointmentId);

  useEffect(() => {
    dispatch(fetchInbox());
  }, [dispatch]);

  if (inboxStatus === "loading" && inbox.length === 0 && !hasThread) {
    return (
      <div className="mf-card flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden">
        <Loading label="Memuat pesan..." />
      </div>
    );
  }

  const threads = [...inbox].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.date || "";
    const bTime = b.lastMessage?.createdAt || b.date || "";
    return String(bTime).localeCompare(String(aTime));
  });

  return (
    <div className="mf-card flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {threads.length === 0 && !hasThread ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <EmptyState
            icon={IconChat}
            title="Belum ada percakapan"
            hint="Chat dokter terbuka setelah konsultasi selesai."
          />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <aside
            className={`flex h-full w-full shrink-0 flex-col overflow-hidden border-r border-hairline bg-white lg:w-[22rem] ${
              hasThread ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="shrink-0 border-b border-hairline px-4 py-3">
              <h1 className="font-display text-xl font-medium text-ink">Pesan</h1>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {threads.map((thread) => (
                <NavLink
                  key={thread.appointmentId}
                  to={`/pesan/${thread.appointmentId}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 border-b border-hairline px-4 py-3 transition ${
                      isActive ? "bg-mist" : "hover:bg-sand/60"
                    }`
                  }
                >
                  <Avatar
                    src={thread.counterpartImgUrl}
                    name={thread.counterpartName}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`min-w-0 truncate text-sm text-ink ${
                          thread.unreadCount > 0 ? "font-bold" : "font-medium"
                        }`}
                      >
                        {thread.counterpartName}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {thread.unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center bg-accent px-1.5 font-mono text-[11px] font-medium text-white">
                            {thread.unreadCount}
                          </span>
                        ) : null}
                        {thread.lastMessage?.createdAt ? (
                          <p className="tabular text-[11px] text-muted">
                            {formatTimeId(thread.lastMessage.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {thread.typing ? (
                      <span className="mt-1 inline-flex min-h-5 items-center">
                        <TypingDots className="text-muted" />
                        <span className="sr-only">sedang mengetik</span>
                      </span>
                    ) : (
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {thread.lastMessage?.body || "Belum ada pesan"}
                      </p>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
          </aside>
          <section
            className={`h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
              hasThread ? "flex" : "hidden lg:flex"
            }`}
          >
            {hasThread ? (
              <Outlet />
            ) : (
              <div className="mf-chat-wallpaper flex flex-1 items-center justify-center px-6">
                <p className="rounded-full bg-white/80 px-4 py-2 text-sm text-muted shadow-xs ring-1 ring-hairline">
                  Pilih percakapan
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
