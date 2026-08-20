import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, getSocket } from "../socket";
import {
  fetchNotifications,
  receiveNotification,
} from "../store/notificationsSlice";
import { useToast } from "../context/ToastContext";

const TOAST_TYPES = {
  queue_called: "info",
  queue_skipped: "error",
  invoice_paid: "success",
  invoice_failed: "error",
  invoice_expired: "error",
};

export default function useNotifications() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.user?.role);

  useEffect(() => {
    if (!token || (role !== "patient" && role !== "doctor")) return undefined;
    dispatch(fetchNotifications());

    const socket = connectSocket();
    if (!socket) return undefined;

    function handleNew(payload) {
      if (!payload?.id) return;
      dispatch(receiveNotification(payload));
      const toastType = TOAST_TYPES[payload.type];
      if (toastType) {
        showToast({
          type: toastType,
          title: payload.title,
          message: payload.message,
          href: payload.href,
        });
      }
    }

    socket.on("notification:new", handleNew);
    return () => {
      const current = getSocket();
      current?.off("notification:new", handleNew);
    };
  }, [dispatch, showToast, token, role]);
}
