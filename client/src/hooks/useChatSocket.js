import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, joinRoom, leaveRoom, getSocket } from "../socket";
import { chatRoomName } from "../utils/format";
import {
  receiveMessage,
  setCounterpartTyping,
  setCounterpartRead,
} from "../store/chatSlice";

export default function useChatSocket(appointmentId) {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (!appointmentId) return undefined;
    const room = chatRoomName(appointmentId);
    const socket = connectSocket();
    if (!socket) return undefined;

    let joined = false;

    function handleMessage(payload) {
      const message = payload?.message || payload;
      if (!message) return;
      dispatch(receiveMessage({ ...message, appointmentId: payload.appointmentId || message.appointmentId }));
    }

    function handleTyping(payload) {
      if (Number(payload?.userId) === Number(userId)) return;
      dispatch(
        setCounterpartTyping({
          appointmentId: payload.appointmentId,
          isTyping: payload.isTyping,
        })
      );
    }

    function handleRead(payload) {
      if (Number(payload?.userId) === Number(userId)) return;
      dispatch(
        setCounterpartRead({
          appointmentId: payload.appointmentId,
          lastReadAt: payload.lastReadAt,
        })
      );
    }

    async function start() {
      const ack = await joinRoom(room);
      joined = Boolean(ack?.ok);
      socket.on("chat:message", handleMessage);
      socket.on("chat:typing", handleTyping);
      socket.on("chat:read", handleRead);
    }

    start();

    return () => {
      const current = getSocket();
      current?.off("chat:message", handleMessage);
      current?.off("chat:typing", handleTyping);
      current?.off("chat:read", handleRead);
      if (joined) leaveRoom(room);
    };
  }, [appointmentId, dispatch, userId]);
}
