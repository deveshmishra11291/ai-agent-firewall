import { useState } from "react";
import { Check, Monitor, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { getAuthSession } from "../../auth.js";
import "./Settings.css";

const SETTINGS_KEY = "ai-firewall-settings";
const DEFAULT_SETTINGS = { compactMode: false, notifications: true, confirmRuns: true, theme: "graphite" };

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = window.localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [saved, setSaved] = useState(false);
  const user = getAuthSession();

  const updateSetting = (key, value) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-kicker"><SlidersHorizontal size={13} /> WORKSPACE CONTROL</div>
        <h1>Settings</h1>
        <p>Shape the workspace around how you review and run agent code.</p>
      </header>
      <section className="settings-card">
        <div className="settings-section-heading"><ShieldCheck size={17} /><div><h2>Account</h2><p>Signed in identity for this workspace.</p></div></div>
        <div className="settings-account"><span>{user?.name?.charAt(0).toUpperCase() || "U"}</span><div><strong>{user?.name || "User"}</strong><small>{user?.email || "user@example.com"}</small></div></div>
      </section>
      <section className="settings-card">
        <div className="settings-section-heading"><Monitor size={17} /><div><h2>Workspace preferences</h2><p>These preferences are saved on this device.</p></div></div>
        <label className="settings-select-label">Interface tone<select value={settings.theme} onChange={(event) => updateSetting("theme", event.target.value)}><option value="graphite">Graphite cinematic</option><option value="high-contrast">High contrast</option></select></label>
        <label className="settings-toggle"><span><strong>Compact workspace</strong><small>Reduce spacing in editor and result panels.</small></span><input type="checkbox" checked={settings.compactMode} onChange={(event) => updateSetting("compactMode", event.target.checked)} /><i /></label>
        <label className="settings-toggle"><span><strong>Confirm before running</strong><small>Keep an extra safety check before executing code.</small></span><input type="checkbox" checked={settings.confirmRuns} onChange={(event) => updateSetting("confirmRuns", event.target.checked)} /><i /></label>
        <label className="settings-toggle"><span><strong>Security notifications</strong><small>Show a notice when a run is blocked by policy.</small></span><input type="checkbox" checked={settings.notifications} onChange={(event) => updateSetting("notifications", event.target.checked)} /><i /></label>
      </section>
      {saved && <div className="settings-saved"><Check size={14} /> Preferences saved locally</div>}
    </div>
  );
}
