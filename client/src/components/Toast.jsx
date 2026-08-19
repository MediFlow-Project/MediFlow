import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../store/uiSlice";

export default function Toast() {
  const toast = useSelector((state) => state.ui.toast);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch(hideToast()), 3600);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "bg-danger text-white"
      : toast.type === "success"
        ? "bg-primary text-white"
        : "bg-ink text-white";

  return (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg ${tone}`}
    >
      {toast.message}
    </div>
  );
}
