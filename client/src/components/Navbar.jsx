import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { homeForRole } from "../utils/format";
import Logo from "./Logo";
import { IconClose, IconMenu } from "./Icons";

const linkClass = ({ isActive }) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-primary text-white"
      : "text-ink/70 hover:bg-sand hover:text-primary"
  }`;

export default function Navbar() {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    dispatch(logout());
    setOpen(false);
    navigate("/");
  }

  const links = [
    { to: "/spesialisasi", label: "Spesialisasi" },
    { to: "/daftar-dokter", label: "Dokter" },
  ];
  if (user?.role === "patient" || !token) {
    links.push({ to: "/chatbot", label: "Konsultasi awal" });
  }
  if (user?.role === "patient") {
    links.push({ to: "/saya", label: "Janji saya" });
    links.push({ to: "/pesan", label: "Pesan" });
  }
  if (user?.role === "doctor") {
    links.push({ to: "/dokter", label: "Praktik hari ini" });
    links.push({ to: "/pesan", label: "Pesan" });
  }
  if (user?.role === "admin") {
    links.push({ to: "/admin/dashboard", label: "Dashboard" });
    links.push({ to: "/admin/janji", label: "Janji" });
    links.push({ to: "/admin/dokter", label: "Master" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Beranda RS MediFlow" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {token && user ? (
            <>
              <Link
                to={homeForRole(user.role)}
                className="hidden max-w-[10rem] truncate rounded-full bg-mist px-3 py-2 text-sm font-semibold text-primary sm:block"
              >
                {user.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-sand sm:inline-flex"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-semibold text-primary sm:inline">
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Daftar
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex rounded-full border border-line p-2 text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-line bg-paper px-4 py-3 lg:hidden"
          aria-label="Navigasi ponsel"
        >
          <div className="flex flex-col gap-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {token && user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-3.5 py-2 text-left text-sm font-semibold text-ink hover:bg-sand"
              >
                Keluar
              </button>
            ) : (
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Masuk
              </NavLink>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
