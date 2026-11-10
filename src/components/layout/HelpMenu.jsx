import { useState } from "react";
import { CircleHelp, Keyboard, Palette } from "lucide-react";
import Dropdown from "../ui/Dropdown";
import IconButton from "../ui/IconButton";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const SHORTCUTS = [
  { keys: "/", description: "Focus the search box" },
  { keys: "Ctrl / ⌘ + K", description: "Focus the search box" },
  { keys: "Esc", description: "Close dialogs, menus and search results" },
  { keys: "↑ ↓", description: "Move through menu and search results" },
  { keys: "Enter", description: "Open the selected result" },
];

/** HelpMenu — help entry point. Currently: keyboard shortcuts (+ the design-system page in development builds). */
export default function HelpMenu({ designSystemPath }) {
  const [showKeys, setShowKeys] = useState(false);
  const items = [
    { key: "shortcuts", label: "Keyboard shortcuts", icon: Keyboard, onClick: () => setShowKeys(true) },
    ...(import.meta.env.DEV && designSystemPath ? [{ key: "ds", label: "Design system", icon: Palette, to: designSystemPath }] : []),
  ];
  return (
    <>
      <Dropdown items={items} label="Help">
        <IconButton icon={CircleHelp} label="Help" />
      </Dropdown>
      <Modal open={showKeys} onClose={() => setShowKeys(false)} title="Keyboard shortcuts" size="sm" footer={<Button variant="secondary" onClick={() => setShowKeys(false)}>Close</Button>}>
        <dl className="divide-y divide-line">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-body text-ink-muted">{s.description}</dt>
              <dd>
                <kbd className="rounded border border-line-strong bg-surface-muted px-2 py-0.5 font-mono text-caption text-ink">{s.keys}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </Modal>
    </>
  );
}
