import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { homeForRole } from "../utils/format";
import Logo from "./Logo";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import { IconClose, IconLogout, IconMenu } from "./Icons";

const linkClass = ({ isActive }) =>
  `relative px-3 py-2 text-[0.9rem] font-medium transition duration-200 ease-soft after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:ease-soft ${
    isActive
      ? "text-ink after:scale-x-100"
      : "text-muted after:scale-x-0 hover:text-ink hover:after:scale-x-100"
  }`;

const guestLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/layanan", label: "Layanan", end: true },
  { to: "/layanan#dokter", label: "Dokter" },
  { to: "/layanan#poliklinik", label: "Poliklinik" },
  { to: "/#kontak", label: "Kontak" },
];

export default function Navbar() {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState({ open: false, pathname });
  const [lifted, setLifted] = useState(false);
  const open = menu.open && menu.pathname === pathname;
  const loggedIn = Boolean(token && user);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function setOpen(next) {
    setMenu({
      open: typeof next === "function" ? next(open) : next,
      pathname,
    });
  }

  function handleLogout() {
    dispatch(logout());
    setOpen(false);
    navigate("/");
  }

  const homeTo = loggedIn ? homeForRole(user.role) : "/";
  const links = loggedIn ? [{ to: "/layanan", label: "Layanan", end: true }] : guestLinks;
  if (user?.role === "patient") {
    links.push({ to: "/saya", label: "Dashboard" });
    links.push({ to: "/tagihan", label: "Tagihan" });
    links.push({ to: "/pesan", label: "Pesan" });
  }
  if (user?.role === "doctor") {
    links.push({ to: "/dokter", label: "Praktik hari ini" });
    links.push({ to: "/pesan", label: "Pesan" });
  }
  if (user?.role === "admin") {
    links.push({ to: "/admin/dashboard", label: "Dashboard" });
  }
  if (loggedIn) {
    links.push({ to: "/akun", label: "Akun" });
  }

  return (
    <header className="sticky top-0 z-40 shrink-0">
      <div
        className={`border-b bg-white/95 backdrop-blur-md transition duration-300 ease-soft ${
          lifted ? "border-line shadow-xs" : "border-hairline"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to={homeTo}
            aria-label={loggedIn ? "Dashboard RS MediFlow" : "Beranda RS MediFlow"}
            className="shrink-0 rounded-xl transition duration-200 ease-soft hover:opacity-85"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
            {links.map((item) =>
              item.to.includes("#") ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative px-3 py-2 text-[0.9rem] font-medium text-muted transition duration-200 ease-soft hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <>
                {(user.role === "patient" || user.role === "doctor") && (
                  <NotificationBell />
                )}
                <Link
                  to="/akun"
                  className="hidden items-center gap-2.5 rounded-full border border-hairline bg-white py-1 pl-1 pr-3.5 transition duration-200 ease-soft hover:border-primary/30 sm:inline-flex"
                >
                  <Avatar
                    src={user.doctor?.imgUrl}
                    name={user.name}
                    size="xs"
                    className="h-7 w-7 ring-primary/15"
                  />
                  <span className="max-w-[8rem] truncate text-[0.82rem] font-semibold text-ink">
                    {user.name}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Keluar"
                  className="hidden items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-2 text-[0.82rem] font-semibold text-ink transition duration-200 ease-soft hover:border-danger/40 hover:text-danger sm:inline-flex"
                >
                  <IconLogout className="h-3.5 w-3.5" />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full px-3 py-2 text-[0.88rem] font-semibold text-ink transition hover:text-primary sm:inline-block"
                >
                  Masuk
                </Link>
                <Link
                  to="/layanan"
                  className="whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-[0.88rem] font-semibold text-white transition duration-200 ease-soft hover:bg-primary-hover"
                >
                  Buat kunjungan
                </Link>
              </>
            )}
            <button
              type="button"
              className="inline-flex rounded-full border border-hairline bg-white p-2.5 text-ink transition duration-200 ease-soft hover:border-primary/30 lg:hidden"
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
            className="mf-fade border-t border-hairline bg-white px-4 pb-4 pt-2 sm:px-6 lg:hidden"
            aria-label="Navigasi ponsel"
          >
            <div className="flex flex-col gap-0.5">
              {links.map((item) =>
                item.to.includes("#") ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-[0.95rem] font-semibold text-muted transition hover:bg-mist hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-3 text-[0.95rem] font-semibold transition ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-mist hover:text-ink"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              )}
              <div className="mt-2 border-t border-hairline pt-2">
                {loggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-[0.95rem] font-semibold text-danger transition hover:bg-clay/5"
                  >
                    <IconLogout className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-3 text-[0.95rem] font-semibold text-ink transition hover:bg-mist"
                    >
                      Masuk
                    </NavLink>
                    <NavLink
                      to="/layanan"
                      onClick={() => setOpen(false)}
                      className="mt-1 block rounded-xl bg-primary px-3 py-3 text-center text-[0.95rem] font-semibold text-white"
                    >
                      Buat kunjungan
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
