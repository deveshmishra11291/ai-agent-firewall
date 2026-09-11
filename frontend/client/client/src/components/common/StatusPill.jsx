import "./StatusPill.css";

/**
 * @param {"success"|"danger"|"neutral"} tone
 */
export default function StatusPill({ tone = "neutral", children }) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}
