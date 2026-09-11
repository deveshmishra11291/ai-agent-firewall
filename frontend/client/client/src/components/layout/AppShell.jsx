import Sidebar from "./Sidebar.jsx";
import "./AppShell.css";

const APP_STARS = [
  ["7%", "18%", "1px", "0s"],
  ["18%", "78%", "2px", "1.8s"],
  ["31%", "11%", "1px", "3.1s"],
  ["44%", "66%", "2px", "0.9s"],
  ["59%", "24%", "1px", "2.5s"],
  ["73%", "84%", "1px", "1.2s"],
  ["87%", "14%", "2px", "3.6s"],
  ["95%", "57%", "1px", "2.1s"],
  ["4%", "42%", "2px", "1.4s"],
  ["12%", "9%", "1px", "2.7s"],
  ["23%", "54%", "1px", "0.5s"],
  ["36%", "89%", "2px", "3.8s"],
  ["48%", "36%", "1px", "1.9s"],
  ["64%", "8%", "2px", "0.7s"],
  ["77%", "47%", "1px", "2.9s"],
  ["84%", "92%", "2px", "1.6s"],
  ["91%", "28%", "1px", "3.4s"],
  ["97%", "76%", "1px", "0.3s"],
  ["2%", "67%", "1px", "1.1s"],
  ["9%", "91%", "2px", "3.2s"],
  ["15%", "35%", "1px", "0.4s"],
  ["21%", "5%", "2px", "2.3s"],
  ["29%", "73%", "1px", "1.7s"],
  ["38%", "48%", "2px", "3.5s"],
  ["53%", "17%", "1px", "0.2s"],
  ["57%", "94%", "2px", "2.6s"],
  ["67%", "58%", "1px", "1.5s"],
  ["72%", "31%", "2px", "3.9s"],
  ["81%", "6%", "1px", "0.6s"],
  ["89%", "81%", "2px", "2.8s"],
  ["94%", "43%", "1px", "1.3s"],
  ["99%", "11%", "1px", "3.7s"],
];

/**
 * Shared page frame: fixed dark sidebar + scrollable content area.
 *
 * @param {boolean} fullBleed - when true, the content area has no
 *   default padding/background so the page can control its own
 *   canvas (used by the dark landing page and the result screens).
 */
export default function AppShell({ children, fullBleed = false }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-stars" aria-hidden="true">
        {APP_STARS.map(([left, top, size, delay], index) => (
          <span
            className="app-star"
            key={index}
            style={{ left, top, width: size, height: size, animationDelay: delay }}
          />
        ))}
      </div>
      <main className={"app-content" + (fullBleed ? " app-content-full-bleed" : "")}>
        {children}
      </main>
    </div>
  );
}
