import { Boxes, CalendarClock, ReceiptText, ShoppingCart, Landmark, Database, Store, Percent, ShieldCheck, Link2, BarChart3, Layers, Workflow, Calculator, UsersRound, Lock, Gauge, ClipboardList, Undo2, BookOpenCheck, Pill, ArrowRight, Check, Menu, X, ChevronDown, Info, AlertTriangle, CircleCheck, Clock, ArrowUp, Sparkles, Minus } from "lucide-react";

const MAP = { Boxes, CalendarClock, ReceiptText, ShoppingCart, Landmark, Database, Store, Percent, ShieldCheck, Link2, BarChart3, Layers, Workflow, Calculator, UsersRound, Lock, Gauge, ClipboardList, Undo2, BookOpenCheck, Pill, ArrowRight, Check, Menu, X, ChevronDown, Info, AlertTriangle, CircleCheck, Clock, ArrowUp, Sparkles, Minus };

/** Decorative icon by name (aria-hidden): meaning is always carried by adjacent text. */
export default function Icon({ name, className = "size-5" }) {
  const C = MAP[name] || Boxes;
  return <C className={className} aria-hidden="true" />;
}
