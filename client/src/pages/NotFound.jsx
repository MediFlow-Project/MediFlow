import LinkButton from "../components/LinkButton";
import { IconArrow } from "../components/Icons";

export default function NotFound() {
  return (
    <div className="mf-card mf-rise mx-auto max-w-xl px-6 py-16 text-center shadow-md">
      <p className="mf-kicker">Halaman tidak tersedia</p>
      <p className="mt-4 font-display text-7xl font-medium leading-none tracking-tight text-primary">
        404
      </p>
      <div className="mf-rule mx-auto" />
      <h1 className="mt-6 font-display text-3xl font-medium text-primary">
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
