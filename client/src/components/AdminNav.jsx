import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/janji", label: "Janji temu" },
  { to: "/admin/tagihan", label: "Pembayaran" },
  { to: "/admin/spesialisasi", label: "Poliklinik" },
  { to: "/admin/dokter", label: "Dokter" },
  { to: "/admin/jadwal", label: "Jadwal" },
  { to: "/admin/obat", label: "Obat" },
];

export default function AdminNav() {
  return (
    <nav className="mb-8" aria-label="Navigasi admin">
      {/* Wraps rather than scrolls, so every section stays reachable on a phone. */}
      <div className="flex flex-wrap gap-1 rounded-md border border-hairline bg-paper p-1.5 shadow-xs">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-sm px-3.5 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] transition duration-200 ease-soft ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-white hover:text-primary"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
