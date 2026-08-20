import { Link } from "react-router-dom";
import { BUTTON_BASE, BUTTON_SIZES, BUTTON_VARIANTS } from "./buttonStyles";

export default function LinkButton({
  to,
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <Link
      to={to}
      className={`${BUTTON_BASE} ${
        BUTTON_SIZES[size]
      } ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
