import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { HOSPITAL } from "../data/hospital";
import Logo from "./Logo";
import { IconPhone, IconPin, IconClock } from "./Icons";

export default function Footer() {
  const { user, token } = useSelector((state) => state.auth);
  const portalTo = token && user?.role === "patient" ? "/saya" : "/login";

  const serviceLinks = [
    { to: "/layanan", label: "Semua layanan" },
    { to: "/layanan#dokter", label: "Dokter" },
    { to: "/layanan#poliklinik", label: "Poliklinik" },
    { to: portalTo, label: "Portal pasien" },
  ];

  return (
    <footer id="kontak" className="mf-surface-ink mt-auto scroll-mt-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <div className="lg:col-span-5">
          <Logo inverted />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            {HOSPITAL.legalName} berdiri sejak {HOSPITAL.established} sebagai rumah
            sakit swasta dengan pelayanan poliklinik terpadu, tenaga spesialis, dan
            pendaftaran kunjungan yang tertib.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[0.78rem] font-medium text-accent-light">
            {HOSPITAL.accreditation}
          </p>
        </div>

        <nav aria-label="Tautan footer" className="lg:col-span-3">
          <p className="mf-kicker-light">Layanan</p>
          <ul className="mt-5 space-y-3 text-sm">
            {serviceLinks.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-2 rounded-full text-white/75 transition duration-200 ease-soft hover:text-accent-light"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-light/80" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className="mf-kicker-light">Kontak &amp; jam layanan</p>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
              <span className="leading-relaxed text-white/80">
                {HOSPITAL.addressLine}
                <br />
                {HOSPITAL.city}
              </span>
            </li>
            <li className="flex gap-3">
              <IconPhone className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
              <span className="leading-relaxed text-white/80">
                Call center {HOSPITAL.callCenter}
                <br />
                <span className="text-accent-light">IGD 24 jam {HOSPITAL.igd}</span>
              </span>
            </li>
            <li className="flex gap-3">
              <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
              <span className="leading-relaxed text-white/70">
                {HOSPITAL.hoursPoli}
                <br />
                Jam besuk {HOSPITAL.hoursVisit}
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-[0.78rem] text-white/45">
            © {new Date().getFullYear()} {HOSPITAL.legalName}
          </p>
          <p className="text-[0.78rem] font-medium text-white/35">
            {HOSPITAL.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
