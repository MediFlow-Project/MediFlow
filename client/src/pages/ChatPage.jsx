import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointment } from "../store/appointmentsSlice";
import { clearChatThread, fetchMessages, markChatRead, sendMessage } from "../store/chatSlice";
import useChatSocket from "../hooks/useChatSocket";
import { canWriteChat, chatClosedHint, formatDateId, sessionLabel } from "../utils/format";
import ChatThread from "../components/ChatThread";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function ChatPage() {
  const { appointmentId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const appointment = useSelector((state) => state.appointments.current);
  const { messages, status, sending, error, counterpartTyping, counterpartLastReadAt, appointmentId: loadedId } = useSelector(
    (state) => state.chat
  );

  useChatSocket(appointmentId);

  useEffect(() => {
    dispatch(fetchAppointment(appointmentId));
    dispatch(fetchMessages(appointmentId));
    return () => {
      dispatch(clearChatThread());
    };
  }, [appointmentId, dispatch]);

  useEffect(() => {
    if (status === "idle" && Number(loadedId) === Number(appointmentId)) {
      dispatch(markChatRead(appointmentId));
    }
  }, [status, appointmentId, loadedId, messages.length, dispatch]);

  if (status === "loading" && !appointment) return <Loading />;
  if (!appointment) {
    return <EmptyState title="Percakapan tidak ditemukan" hint={error} />;
  }

  const counterpartName =
    user?.role === "doctor" ? appointment.patient?.name || "Pasien" : appointment.doctor?.name || "Dokter";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Chat"
        title={counterpartName}
        description={`${formatDateId(appointment.date)} · ${sessionLabel(appointment.session)} · nomor ${String(appointment.queueNumber).padStart(2, "0")}. Chat aktif setelah konsul sampai H+1.`}
      >
        <Link to="/pesan" className="text-sm font-semibold text-primary">
          Semua pesan
        </Link>
      </PageHeader>
      <ChatThread
        appointmentId={Number(appointmentId)}
        counterpartName={counterpartName}
        messages={messages}
        currentUserId={user?.id}
        counterpartTyping={counterpartTyping}
        counterpartLastReadAt={counterpartLastReadAt}
        writable={canWriteChat(appointment)}
        closedHint={chatClosedHint(appointment)}
        sending={sending}
        error={error}
        onSend={(body) => dispatch(sendMessage({ appointmentId, body }))}
      />
    </div>
  );
}
