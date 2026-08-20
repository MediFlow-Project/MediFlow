import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  connectSocket,
  joinRoom,
  leaveRoom,
  getSocket,
} from "../socket";
import { applyBoardUpdate } from "../store/queueSlice";
import { queueRoomName } from "../utils/format";

export default function useQueueSocket({ doctorId, date, session, onUpdated }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!doctorId || !date || !session) return undefined;
    const room = queueRoomName(doctorId, date, session);
    const socket = connectSocket();
    if (!socket) return undefined;

    let joined = false;

    function handleUpdated(payload) {
      dispatch(applyBoardUpdate(payload));
      onUpdated?.(payload);
    }

    function handleCalled() {
      onUpdated?.();
    }

    let initialConnect = true;

    async function sync() {
      const ack = await joinRoom(room);
      joined = Boolean(ack?.ok);
      if (!initialConnect) onUpdated?.();
      initialConnect = false;
    }

    socket.on("queue:updated", handleUpdated);
    socket.on("queue:called", handleCalled);
    socket.on("queue:completed", handleCalled);
    socket.on("connect", sync);
    if (socket.connected) sync();

    return () => {
      const current = getSocket();
      current?.off("queue:updated", handleUpdated);
      current?.off("queue:called", handleCalled);
      current?.off("queue:completed", handleCalled);
      current?.off("connect", sync);
      if (joined) leaveRoom(room);
    };
  }, [doctorId, date, session, dispatch, onUpdated]);
}
