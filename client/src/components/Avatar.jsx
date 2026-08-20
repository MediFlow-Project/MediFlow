import { useEffect, useState } from "react";
import { initials } from "../utils/format";

const SIZES = {
  xs: "h-8 w-8 text-[0.58rem]",
  sm: "h-10 w-10 text-[0.66rem]",
  md: "h-12 w-12 text-xs",
  lg: "h-16 w-16 text-base",
  xl: "h-20 w-20 text-xl",
};

export default function Avatar({ src, name, size = "md", className = "" }) {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(src) && !broken;

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-mist to-sand font-display font-semibold text-primary shadow-xs ring-1 ring-primary/10 ${
        SIZES[size] || SIZES.md
      } ${className}`}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover object-top"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
