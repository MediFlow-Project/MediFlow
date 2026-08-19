import { NavLink } from "react-router-dom";

const items = [
  { to: "/admin/janji", label: "Janji temu" },
  { to: "/admin/spesialisasi", label: "Spesialisasi" },
  { to: "/admin/dokter", label: "Dokter" },
  { to: "/admin/jadwal", label: "Jadwal" },
  { to: "/admin/obat", label: "Obat" },
];

export default function AdminNav() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Navigasi admin">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-sm font-semibold ${
              isActive ? "bg-primary text-white" : "border border-line bg-paper text-ink hover:bg-sand"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
