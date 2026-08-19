export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
  ...props
}) {
  const styles = {
    primary:
      "bg-primary text-white hover:bg-primary-hover disabled:bg-sand disabled:text-muted",
    pine: "bg-primary-dark text-white hover:bg-primary disabled:bg-sand disabled:text-muted",
    ghost:
      "bg-white text-primary border border-line hover:bg-mist disabled:opacity-40",
    danger:
      "bg-white text-danger border border-danger/25 hover:bg-red-50 disabled:opacity-40",
    amber:
      "bg-amber text-white hover:bg-amber/90 disabled:bg-sand disabled:text-muted",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
