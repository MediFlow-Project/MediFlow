export const BUTTON_BASE =
  "inline-flex items-center justify-center font-semibold transition duration-200 ease-soft";

export const BUTTON_VARIANTS = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-sand disabled:text-muted",
  pine:
    "bg-ink text-white hover:bg-pine-mid disabled:bg-sand disabled:text-muted",
  ghost:
    "border border-line bg-white text-primary hover:border-primary hover:bg-mist disabled:opacity-45",
  danger:
    "border border-danger/25 bg-white text-danger hover:border-danger/50 hover:bg-clay/5 disabled:opacity-45",
  accent:
    "bg-accent text-white hover:bg-accent-strong disabled:bg-white/20 disabled:text-white/55",
  quiet:
    "text-primary hover:text-accent-ink",
};

export const BUTTON_SIZES = {
  sm: "gap-1.5 rounded-full px-3.5 py-2 text-[0.78rem]",
  md: "gap-2 rounded-full px-5 py-2.5 text-[0.88rem]",
  lg: "gap-2.5 rounded-full px-7 py-3.5 text-[0.95rem]",
};
