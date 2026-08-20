import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { HOSPITAL } from "../data/hospital";
import { homeForRole } from "../utils/format";
import Logo from "./Logo";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import { IconClose, IconLogout, IconMenu, IconPhone, IconPin } from "./Icons";

const linkClass = ({ isActive }) =>
  `relative px-3 py-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] transition duration-200 ease-soft after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold after:transition-transform after:duration-300 after:ease-soft ${
    isActive
      ? "text-primary after:scale-x-100"
      : "text-muted after:scale-x-0 hover:text-primary hover:after:scale-x-100"
  }`;

export default function Navbar() {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Keyed by pathname so navigating (including browser back) collapses the menu without an effect.
  const [menu, setMenu] = useState({ open: false, pathname });
  const [lifted, setLifted] = useState(false);
  const open = menu.open && menu.pathname === pathname;

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

  const homeTo = token && user ? homeForRole(user.role) : "/";
  const links = [{ to: "/layanan", label: "Layanan", end: true }];
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
  if (token && user) {
    links.push({ to: "/akun", label: "Akun" });
  }

  return (
    <header className="sticky top-0 z-40 shrink-0">
      <div className="mf-surface-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-[11px] font-medium sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-1.5 text-white/75">
            <IconPin className="h-3.5 w-3.5 shrink-0 text-gold" />
            {HOSPITAL.addressLine}, {HOSPITAL.city}
          </p>
          <p className="inline-flex items-center gap-3">
            <a
              href={`tel:${HOSPITAL.igd.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-xs transition hover:text-gold"
            >
              <IconPhone className="h-3.5 w-3.5 shrink-0 text-gold" />
              IGD 24 jam {HOSPITAL.igd}
            </a>
            <span className="hidden h-3 w-px bg-white/25 sm:inline-block" />
            <span className="hidden text-white/70 sm:inline">{HOSPITAL.accreditation}</span>
          </p>
        </div>
      </div>

      <div
        className={`mf-glass border-b transition duration-300 ease-soft ${
          lifted ? "border-hairline shadow-md" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to={homeTo}
            aria-label={token && user ? "Dashboard RS MediFlow" : "Beranda RS MediFlow"}
            className="shrink-0 rounded-sm transition duration-200 ease-soft hover:opacity-85"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {token && user ? (
              <>
                {(user.role === "patient" || user.role === "doctor") && (
                  <NotificationBell />
                )}
                <Link
                  to="/akun"
                  className="hidden items-center gap-2.5 rounded-full border border-hairline bg-white/70 py-1 pl-1 pr-3.5 shadow-xs transition duration-200 ease-soft hover:border-gold/50 hover:shadow-md sm:inline-flex"
                >
                  <Avatar
                    src={user.doctor?.imgUrl}
                    name={user.name}
                    size="xs"
                    className="h-7 w-7 shadow-none ring-primary/15"
                  />
                  <span className="max-w-[8rem] truncate text-[0.78rem] font-semibold text-primary">
                    {user.name}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Keluar"
                  className="hidden items-center gap-2 rounded-sm border border-hairline bg-white px-3.5 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink shadow-xs transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-danger/40 hover:text-danger hover:shadow-md sm:inline-flex"
                >
                  <IconLogout className="h-3.5 w-3.5" />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-sm px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary transition hover:text-bronze sm:inline-block"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="whitespace-nowrap rounded-sm bg-primary px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white shadow-sm transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
                >
                  Daftar<span className="hidden sm:inline"> pasien</span>
                </Link>
              </>
            )}
            <button
              type="button"
              className="inline-flex rounded-sm border border-hairline bg-white p-2.5 text-ink shadow-xs transition duration-200 ease-soft hover:border-gold/50 lg:hidden"
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
            className="mf-fade border-t border-hairline bg-paper px-4 pb-4 pt-2 shadow-lg sm:px-6 lg:hidden"
            aria-label="Navigasi ponsel"
          >
            <div className="flex flex-col gap-0.5">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-sm px-3 py-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] transition ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-muted hover:bg-mist hover:text-primary"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-hairline pt-2">
                {token && user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center gap-2 rounded-sm px-3 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.14em] text-danger transition hover:bg-clay/5"
                  >
                    <IconLogout className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-3 py-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary transition hover:bg-mist"
                  >
                    Masuk
                  </NavLink>
                )}
              </div>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
