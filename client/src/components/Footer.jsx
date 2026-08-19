import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-primary-dark/20 bg-primary-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="max-w-md">
          <Logo inverted />
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Melayani dengan hati, merawat dengan teliti. Pendaftaran poliklinik,
            konsultasi dokter, dan antrean kunjungan dalam satu alur yang tertib.
          </p>
        </div>
        <nav aria-label="Tautan footer">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Layanan</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/spesialisasi" className="text-white/80 hover:text-white">
                Spesialisasi
              </Link>
            </li>
            <li>
              <Link to="/daftar-dokter" className="text-white/80 hover:text-white">
                Daftar dokter
              </Link>
            </li>
            <li>
              <Link to="/chatbot" className="text-white/80 hover:text-white">
                Konsultasi awal
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Jam praktik</p>
          <p className="mt-4 text-lg font-semibold">Senin–Sabtu</p>
          <p className="mt-1 text-sm text-white/70">Pagi 08.00–12.00</p>
          <p className="text-sm text-white/70">Siang 13.00–16.00</p>
        </div>
      </div>
    </footer>
  );
}
