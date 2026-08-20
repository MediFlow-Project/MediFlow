export const BUTTON_BASE =
  "inline-flex items-center justify-center font-semibold uppercase tracking-[0.14em] transition duration-200 ease-soft";

export const BUTTON_VARIANTS = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md disabled:bg-sand disabled:text-muted disabled:shadow-none",
  pine:
    "bg-primary-dark text-white shadow-sm hover:bg-primary-lift hover:shadow-md disabled:bg-sand disabled:text-muted disabled:shadow-none",
  ghost:
    "border border-line bg-white text-primary shadow-xs hover:border-gold/60 hover:text-bronze hover:shadow-md disabled:opacity-45 disabled:shadow-none",
  danger:
    "border border-danger/25 bg-white text-danger shadow-xs hover:border-danger/50 hover:bg-clay/5 hover:shadow-md disabled:opacity-45 disabled:shadow-none",
  // Sits on navy surfaces, so the disabled state stays translucent instead of a beige slab.
  amber:
    "bg-gold text-primary-dark shadow-sm hover:bg-amber hover:text-white hover:shadow-gold disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none",
  quiet:
    "text-primary hover:text-bronze",
};

export const BUTTON_SIZES = {
  sm: "gap-1.5 rounded-sm px-3.5 py-2 text-[0.66rem]",
  md: "gap-2 rounded-sm px-5 py-2.5 text-[0.72rem]",
  lg: "gap-2.5 rounded-md px-7 py-3.5 text-[0.78rem]",
};
