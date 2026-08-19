import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

export default function AppLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main
        className={
          isLanding
            ? "flex-1"
            : "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-8"
        }
      >
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
