import { Link } from "react-router-dom";
import BrandLogo from "../../components/ui/BrandLogo";

/** The e-Pulse logo as a home link. `dark` = sits on a dark surface (footer) → logo on a white card. */
export default function BrandMark({ to = "/", onClick, invert = false, dark = false }) {
  return (
    <Link to={to} onClick={onClick} className={`pub-brand ${invert ? "pub-brand-invert" : ""}`} aria-label="e-Pulse — home">
      <BrandLogo tile={dark} className={dark ? "h-14" : "h-14"} />
    </Link>
  );
}
