import LinkButton from "../components/LinkButton";
import { IconArrow } from "../components/Icons";

export default function NotFound() {
  return (
    <div className="mf-card mf-rise mx-auto max-w-xl px-6 py-16 text-center">
      <p className="mf-kicker">Halaman tidak tersedia</p>
      <p className="mf-display mt-4 text-7xl text-ink">404</p>
      <div className="mf-rule mx-auto" />
      <h1 className="mf-display mt-6 text-3xl text-ink">
        Alamat tidak ditemukan
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        Halaman ini tidak ada di situs RS MediFlow. Kembali ke beranda untuk
        memilih layanan poliklinik.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton to="/" size="lg">
          Kembali ke beranda
          <IconArrow className="h-4 w-4" />
        </LinkButton>
        <LinkButton to="/layanan" variant="ghost" size="lg">
          Lihat layanan
        </LinkButton>
      </div>
    </div>
  );
}
