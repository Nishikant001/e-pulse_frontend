import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, FileText, Lock, Mail, Package, ShieldCheck, ShoppingCart, Truck, Users, Building2, BarChart3 } from "lucide-react";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Input from "../ui/Input";
import BrandLogo from "../ui/BrandLogo";
import { cn } from "../../utils/cn";
import { API_BASE_URL } from "../../config/api";
import { adminRequest } from "../../utils/adminApi";

/**
 * One sign-in page for both portals. /login and /admin/login both render it; only the preselected tab differs,
 * so an administrator no longer has to know the /admin/login URL — they just pick "Admin" on the normal sign-in.
 *
 * Distributor : POST {API_BASE_URL}/login  → localStorage["user"] → /dashboard          (unchanged logic)
 * Admin       : POST {API_BASE_URL}/admin/login (httpOnly cookie, nothing stored in the browser) → /admin/dashboard
 */
const PORTALS = {
  distributor: {
    label: "Distributor",
    icon: Truck,
    badge: "Distributor Portal",
    heading: "Orders, stock and billing — all in one place.",
    sub: "Sign in to manage your distribution business with the company.",
    form: "Sign in with the user ID provided by your company.",
    highlights: [
      { icon: ShoppingCart, title: "Purchase orders", text: "Create and track your orders with the company." },
      { icon: Package, title: "Stock & batches", text: "Batch-wise inventory with expiry visibility." },
      { icon: FileText, title: "Invoices & reports", text: "Billing, returns and reports in one place." },
    ],
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    badge: "Admin Console",
    heading: "Run your distribution network with confidence.",
    sub: "One secure console for distributors, inventory, orders and reports.",
    form: "Company administrators and Super Admins sign in here.",
    highlights: [
      { icon: Building2, title: "Distributor network", text: "Onboard and manage every distributor in one place." },
      { icon: Users, title: "Admins & roles", text: "Control who can see and do what across the platform." },
      { icon: BarChart3, title: "Live reports", text: "Sales, stock and expiry insight, always in sync." },
    ],
  },
};

const LAST_KEY = "dms.login.portal";
const readLast = () => {
  try {
    const v = localStorage.getItem(LAST_KEY);
    return v === "admin" || v === "distributor" ? v : null;
  } catch {
    return null;
  }
};

export default function PortalLoginPage({ initialPortal, onAdminLogin, adminRedirect = "/admin/dashboard" }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [portal, setPortal] = useState(() => initialPortal || (params.get("portal") === "admin" ? "admin" : readLast() || "distributor"));
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const cfg = PORTALS[portal];
  const isAdmin = portal === "admin";

  const choose = (id) => {
    if (busy) return;
    setPortal(id);
    setMessage({ type: "", text: "" });
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch {
      /* preference only */
    }
  };

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitDistributor = async () => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: form.email.trim(), password: form.password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "Login failed");
    localStorage.setItem("user", JSON.stringify(data.user));
    setMessage({ type: "success", text: "Login successful! Redirecting..." });
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  };

  const submitAdmin = async () => {
    if (onAdminLogin) await onAdminLogin(form.email.trim(), form.password);
    else await adminRequest("/login", { method: "POST", body: { email: form.email.trim(), password: form.password } });
    navigate(adminRedirect, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setBusy(true);
    try {
      if (isAdmin) await submitAdmin();
      else await submitDistributor();
    } catch (err) {
      const text = isAdmin
        ? err?.status === 429 ? "Too many failed attempts. Please wait a few minutes and try again."
          : err?.status === 503 ? "The Admin portal is not configured on this server."
          : err?.status === 401 ? "Invalid email or password."
          : "Unable to sign in right now. Please try again."
        : err.message || "Login failed. Please try again.";
      setMessage({ type: "error", text });
      setForm((f) => ({ ...f, password: "" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (desktop) — recolours with the selected portal */}
      <section
        className={cn(
          "relative hidden overflow-hidden p-12 text-white transition-colors duration-500 lg:flex lg:flex-col lg:justify-between",
          isAdmin ? "bg-gradient-to-br from-console-950 via-console-800 to-brand-700" : "bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600",
        )}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-white/5" aria-hidden="true" />
        {isAdmin ? <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" /> : null}

        <Link to="/" aria-label="e-Pulse — go to website home" className="relative flex w-fit items-center gap-3 rounded-control transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <BrandLogo tile className="h-16 " tileClassName="rounded-card px-4 py-2" />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">{cfg.heading}</h2>
          <p className="mt-3 text-body text-brand-100">{cfg.sub}</p>
          <ul className="mt-10 space-y-5">
            {cfg.highlights.map(({ icon, title, text }) => {
              const Icon = icon;
              return (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-white/10 ring-1 ring-white/20">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-body font-semibold">{title}</p>
                  <p className="text-caption text-brand-100">{text}</p>
                </div>
              </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-caption text-brand-200">© {new Date().getFullYear()} e-Pulse. All rights reserved.</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-canvas p-6 sm:p-10 lg:bg-surface">
        <div className="w-full max-w-sm">
          <Link to="/" aria-label="e-Pulse — go to website home" className="mb-8 flex w-fit items-center gap-3 rounded-control lg:hidden">
            <BrandLogo className="h-14" />
          </Link>

          {/* Portal switch — the whole point: Admin is one click away from the normal sign-in */}
          <div role="tablist" aria-label="Sign in as" className="grid grid-cols-2 gap-1 rounded-card bg-neutral-100 p-1">
            {Object.entries(PORTALS).map(([id, p]) => {
              const Icon = p.icon;
              const active = portal === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`login-tab-${id}`}
                  aria-selected={active}
                  aria-controls="login-panel"
                  onClick={() => choose(id)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-control px-3 py-2 text-body font-medium transition-all duration-150",
                    active ? "bg-surface text-brand-700 shadow-card" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {p.label}
                </button>
              );
            })}
          </div>

          <div id="login-panel" role="tabpanel" aria-labelledby={`login-tab-${portal}`}>
            <h1 className="mt-8 text-page font-semibold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-1 text-body text-ink-muted">{cfg.form}</p>

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              {message.text ? <Alert tone={message.type === "success" ? "success" : "error"}>{message.text}</Alert> : null}
              <Input label="Email" type="email" name="email" autoComplete="username" placeholder="you@company.com" required leftIcon={Mail} className="h-11" value={form.email} onChange={change} disabled={busy} />
              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  leftIcon={Lock}
                  className="h-11"
                  value={form.password}
                  onChange={change}
                  disabled={busy}
                  rightSlot={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="rounded p-1.5 text-ink-subtle hover:bg-neutral-100 hover:text-ink">
                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </button>
                  }
                />
                {!isAdmin ? (
                  <div className="mt-2 text-right">
                    <Link to="/forgot-password" className="text-caption font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800">
                      Forgot password?
                    </Link>
                  </div>
                ) : null}
              </div>
              <Button type="submit" size="lg" fullWidth loading={busy} disabled={!form.email || !form.password}>
                Sign in as {cfg.label}
              </Button>
            </form>
          </div>

          <div className="mt-8 space-y-2 border-t border-line pt-5 text-center text-caption text-ink-subtle">
            {!isAdmin ? <p>First time? Your company administrator will give you a user ID — use “Forgot password?” to set your password.</p> : null}
            <p>
              By signing in, you agree to our{" "}
              <Link to="/terms" className="font-medium text-brand-700 underline underline-offset-2">Terms of Service</Link> and{" "}
              <Link to="/privacy" className="font-medium text-brand-700 underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
