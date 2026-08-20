import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, getSocket } from "../socket";
import {
  applyInboxMessage,
  fetchInbox,
  receiveMessage,
  setInboxTyping,
} from "../store/chatSlice";
import { useToast } from "../context/ToastContext";

const TYPING_CLEAR_MS = 2000;

function previewBody(body, max = 80) {
  const text = String(body || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default function useChatAlerts() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const user = useSelector((state) => state.auth.user);
  const inbox = useSelector((state) => state.chat.inbox);
  const appointmentId = useSelector((state) => state.chat.appointmentId);

  const userRef = useRef(user);
  const inboxRef = useRef(inbox);
  const openRef = useRef(appointmentId);
  const seenRef = useRef(new Set());
  const typingTimers = useRef(new Map());

  userRef.current = user;
  inboxRef.current = inbox;
  openRef.current = appointmentId;

  useEffect(() => {
    const role = user?.role;
    if (role !== "patient" && role !== "doctor") return undefined;

    const socket = connectSocket();
    if (!socket) return undefined;

    function handleMessage(payload) {
      const message = payload?.message || payload;
      if (!message?.id) return;
      const threadId = Number(payload.appointmentId || message.appointmentId);
      const me = userRef.current;

      dispatch(
        receiveMessage({
          ...message,
          appointmentId: threadId,
        })
      );
      dispatch(
        applyInboxMessage({
          appointmentId: threadId,
          message,
          senderName: payload.senderName,
          myUserId: me?.id,
        })
      );

      const exists = inboxRef.current.some(
        (thread) => Number(thread.appointmentId) === threadId
      );
      if (!exists) dispatch(fetchInbox());

      if (Number(message.senderId) === Number(me?.id)) return;
      if (seenRef.current.has(message.id)) return;
      seenRef.current.add(message.id);
      if (seenRef.current.size > 200) {
        const first = seenRef.current.values().next().value;
        seenRef.current.delete(first);
      }
      if (!Number.isInteger(threadId) || threadId <= 0) return;
      if (Number(openRef.current) === threadId) return;

      const thread = inboxRef.current.find(
        (item) => Number(item.appointmentId) === threadId
      );
      showToast({
        type: "chat",
        title: payload.senderName || thread?.counterpartName || "Pesan baru",
        message: previewBody(message.body),
        href: `/pesan/${threadId}`,
        appointmentId: threadId,
      });
    }

    function handleTyping(payload) {
      const me = userRef.current;
      if (Number(payload?.userId) === Number(me?.id)) return;
      const threadId = Number(payload.appointmentId);
      if (!threadId) return;

      dispatch(
        setInboxTyping({
          appointmentId: threadId,
          isTyping: Boolean(payload.isTyping),
        })
      );

      const timers = typingTimers.current;
      clearTimeout(timers.get(threadId));
      if (payload.isTyping) {
        timers.set(
          threadId,
          setTimeout(() => {
            dispatch(setInboxTyping({ appointmentId: threadId, isTyping: false }));
            timers.delete(threadId);
          }, TYPING_CLEAR_MS)
        );
      } else {
        timers.delete(threadId);
      }
    }

    socket.on("chat:message", handleMessage);
    socket.on("chat:typing", handleTyping);

    return () => {
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
      const current = getSocket();
      current?.off("chat:message", handleMessage);
      current?.off("chat:typing", handleTyping);
    };
  }, [dispatch, showToast, user?.id, user?.role]);
}
