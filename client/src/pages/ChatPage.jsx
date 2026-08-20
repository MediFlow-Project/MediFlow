import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointment } from "../store/appointmentsSlice";
import {
  clearChatThread,
  fetchMessages,
  markChatRead,
  sendMessage,
} from "../store/chatSlice";
import useChatSocket from "../hooks/useChatSocket";
import { canWriteChat, chatClosedHint } from "../utils/format";
import ChatThread from "../components/ChatThread";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import LinkButton from "../components/LinkButton";

export default function ChatPage() {
  const { appointmentId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const appointment = useSelector((state) => state.appointments.current);
  const {
    messages,
    status,
    sending,
    error,
    counterpartTyping,
    counterpartLastReadAt,
    counterpartLastReadMessageId,
    appointmentId: loadedId,
  } = useSelector((state) => state.chat);

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

  if (status === "loading" && !appointment) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center">
        <Loading label="Membuka percakapan..." />
      </div>
    );
  }
  if (!appointment) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4">
        <LinkButton to="/pesan" variant="ghost" className="lg:hidden">
          Kembali
        </LinkButton>
        <EmptyState title="Percakapan tidak ditemukan" hint={error} />
      </div>
    );
  }

  const counterpartName =
    user?.role === "doctor"
      ? appointment.patient?.name || "Pasien"
      : appointment.doctor?.name || "Dokter";
  const counterpartImgUrl =
    user?.role === "doctor" ? null : appointment.doctor?.imgUrl || null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChatThread
        appointmentId={Number(appointmentId)}
        counterpartName={counterpartName}
        counterpartImgUrl={counterpartImgUrl}
        messages={messages}
        currentUserId={user?.id}
        counterpartTyping={counterpartTyping}
        counterpartLastReadAt={counterpartLastReadAt}
        counterpartLastReadMessageId={counterpartLastReadMessageId}
        writable={canWriteChat(appointment)}
        closedHint={chatClosedHint(appointment)}
        sending={sending}
        error={error}
        onSend={(body) => dispatch(sendMessage({ appointmentId, body }))}
      />
    </div>
  );
}
