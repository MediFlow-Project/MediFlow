import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, joinRoom, leaveRoom, getSocket } from "../socket";
import { chatRoomName } from "../utils/format";
import {
  fetchMessages,
  receiveMessage,
  setCounterpartTyping,
  setCounterpartRead,
} from "../store/chatSlice";

const TYPING_CLEAR_MS = 2000;

export default function useChatSocket(appointmentId) {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (!appointmentId) return undefined;
    const room = chatRoomName(appointmentId);
    const socket = connectSocket();
    if (!socket) return undefined;

    let joined = false;
    let typingClear;

    function handleMessage(payload) {
      const message = payload?.message || payload;
      if (!message) return;
      dispatch(receiveMessage({ ...message, appointmentId: payload.appointmentId || message.appointmentId }));
    }

    function handleTyping(payload) {
      if (Number(payload?.userId) === Number(userId)) return;
      clearTimeout(typingClear);
      dispatch(
        setCounterpartTyping({
          appointmentId: payload.appointmentId,
          isTyping: payload.isTyping,
        })
      );
      if (payload.isTyping) {
        typingClear = setTimeout(() => {
          dispatch(
            setCounterpartTyping({
              appointmentId: payload.appointmentId,
              isTyping: false,
            })
          );
        }, TYPING_CLEAR_MS);
      }
    }

    function handleRead(payload) {
      if (Number(payload?.userId) === Number(userId)) return;
      dispatch(
        setCounterpartRead({
          appointmentId: payload.appointmentId,
          lastReadAt: payload.lastReadAt,
          lastReadMessageId: payload.lastReadMessageId,
        })
      );
    }

    let initialConnect = true;

    async function sync() {
      const ack = await joinRoom(room);
      joined = Boolean(ack?.ok);
      if (!initialConnect) dispatch(fetchMessages(appointmentId));
      initialConnect = false;
    }

    socket.on("chat:message", handleMessage);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:read", handleRead);
    socket.on("connect", sync);
    if (socket.connected) sync();

    return () => {
      clearTimeout(typingClear);
      const current = getSocket();
      current?.off("chat:message", handleMessage);
      current?.off("chat:typing", handleTyping);
      current?.off("chat:read", handleRead);
      current?.off("connect", sync);
      if (joined) leaveRoom(room);
    };
  }, [appointmentId, dispatch, userId]);
}
