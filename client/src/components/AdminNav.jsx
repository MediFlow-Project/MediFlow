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
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ease-soft ${
                isActive
                  ? "bg-primary text-white"
                  : "border border-line bg-white text-muted hover:border-primary hover:text-primary"
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
