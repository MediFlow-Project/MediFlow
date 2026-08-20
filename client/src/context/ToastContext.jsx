import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((payload = {}) => {
    setToast({
      type: payload.type || "info",
      title: payload.title || null,
      message: payload.message,
      href: payload.href || payload.to || null,
      to: payload.to || payload.href || null,
      appointmentId: payload.appointmentId || null,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({ toast, showToast, hideToast }),
    [toast, showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
