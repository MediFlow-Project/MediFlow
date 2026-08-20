import { IconAlert, IconCheck, IconInfo } from "./Icons";

const TONES = {
  danger: { box: "border-danger/20 bg-clay/5 text-danger", Icon: IconAlert },
  warning: { box: "border-gold/45 bg-amber-soft text-bronze", Icon: IconAlert },
  info: { box: "border-primary/12 bg-mist text-primary", Icon: IconInfo },
  success: { box: "border-moss/25 bg-moss/8 text-moss", Icon: IconCheck },
};

export default function Alert({ tone = "danger", title, className = "", children }) {
  const { box, Icon } = TONES[tone] || TONES.danger;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-sm border px-4 py-3.5 text-sm leading-relaxed ${box} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={title ? "mt-1 opacity-90" : "font-medium"}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}
