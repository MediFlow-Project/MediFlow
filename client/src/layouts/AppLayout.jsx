import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useChatAlerts from "../hooks/useChatAlerts";
import useNotifications from "../hooks/useNotifications";

function ChatAlerts() {
  useChatAlerts();
  return null;
}

function NotificationAlerts() {
  useNotifications();
  return null;
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const role = useSelector((state) => state.auth.user?.role);
  const isLanding = pathname === "/";
  const isChat = pathname.startsWith("/pesan");

  let mainClass = "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-8";
  if (isLanding) mainClass = "flex-1";
  if (isChat) {
    mainClass =
      "mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8";
  }

  return (
    <div
      className={
        isChat
          ? "flex h-svh flex-col overflow-hidden bg-paper"
          : "flex min-h-svh flex-col"
      }
    >
      <Navbar />
      <main className={mainClass}>
        <Outlet />
      </main>
      {isChat ? null : <Footer />}
      {(role === "patient" || role === "doctor") && <ChatAlerts />}
      {(role === "patient" || role === "doctor") && <NotificationAlerts />}
    </div>
  );
}
