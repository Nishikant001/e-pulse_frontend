import { cn } from "../../utils/cn";
import fullSrc from "../../assets/brand/epulse-logo.png";
import markSrc from "../../assets/brand/epulse-mark.png";

/**
 * Company logo, used exactly as supplied (assets/brand/epulse-logo.png). variant "mark" = the emblem alone, only for places too narrow
 * for the full logo (collapsed sidebar rail). `tile` puts the artwork on a white rounded card for dark / gradient surfaces.
 * `className` sizes the image (give it a height, e.g. h-10); width follows the artwork.
 */
export default function BrandLogo({ variant = "full", tile = false, className, tileClassName }) {
  const img = <img src={variant === "mark" ? markSrc : fullSrc} alt="" aria-hidden="true" draggable="false" className={cn("w-auto object-contain", className)} />;
  return tile ? <span className={cn("inline-flex shrink-0 items-center justify-center rounded-control bg-white px-2 py-1 shadow-card", tileClassName)}>{img}</span> : img;
}
