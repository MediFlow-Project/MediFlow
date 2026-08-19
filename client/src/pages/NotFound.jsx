import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="mf-kicker">404</p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink">
        Halaman tidak ditemukan
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Tautan ini tidak tersedia. Kembali ke beranda untuk memilih layanan.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
