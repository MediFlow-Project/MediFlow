import { BUTTON_BASE, BUTTON_SIZES, BUTTON_VARIANTS } from "./buttonStyles";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BUTTON_BASE} enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:cursor-not-allowed ${
        BUTTON_SIZES[size]
      } ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
