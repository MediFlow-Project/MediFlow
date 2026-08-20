import { HOSPITAL } from "../data/hospital";
import Logo from "./Logo";

export default function Letterhead({ compact = false }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-accent/50 pb-4">
      <Logo compact={compact} />
      <address className="text-right text-[11px] not-italic leading-relaxed text-muted">
        <p className="font-semibold text-ink">{HOSPITAL.legalName}</p>
        <p>{HOSPITAL.addressLine}</p>
        <p>{HOSPITAL.city}</p>
        <p>Call center {HOSPITAL.callCenter}</p>
      </address>
    </header>
  );
}
