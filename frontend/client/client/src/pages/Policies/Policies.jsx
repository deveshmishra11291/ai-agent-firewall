import { ShieldAlert, HardDrive, FileEdit, Wifi, Terminal, Zap } from "lucide-react";
import SectionCard from "../../components/common/SectionCard.jsx";
import "./Policies.css";

// This mirrors the actual logic in backend/security.py and backend/policy.py.
// It is a read-only summary, not a live editor — there is no
// GET/PUT /api/policies endpoint yet, so nothing here can be changed
// from the UI. Update this file if the backend's risk weights or
// threshold change.
const CAPABILITIES = [
  {
    icon: HardDrive,
    label: "Filesystem Read",
    risk: 60,
    detail: "std::fs imports, File::open, read_to_string",
  },
  {
    icon: FileEdit,
    label: "Filesystem Write",
    risk: 80,
    detail: "File::create, remove_file, remove_dir",
  },
  {
    icon: Wifi,
    label: "Network",
    risk: 60,
    detail: "std::net imports, TcpStream, TcpListener, UdpSocket",
  },
  {
    icon: Terminal,
    label: "Process Execution",
    risk: 100,
    detail: "std::process imports, Command::new/spawn/output",
  },
  {
    icon: Zap,
    label: "Dynamic Execution",
    risk: 100,
    detail: "unsafe blocks, eval/exec-style patterns",
  },
];

const RISK_THRESHOLD = 50;

function riskTier(risk) {
  if (risk >= 80) return "high";
  if (risk >= 50) return "medium";
  return "low";
}

export default function Policies() {
  return (
    <div className="policies-page">
      <header className="policies-header">
        <div className="policies-breadcrumb">WORKSPACE / POLICY ENGINE</div>
        <h1>Policies</h1>
        <p>
          A read-only view of the rules the sandbox actually enforces. Policy
          editing isn't available yet — this reflects the current backend
          configuration.
        </p>
      </header>

      <SectionCard title="Capability risk weights" className="policies-card">
        <ul className="policies-list">
          {CAPABILITIES.map(({ icon: Icon, label, risk, detail }) => (
            <li className={`policies-row policies-row-${riskTier(risk)}`} key={label}>
              <span className="policies-row-label">
                <Icon size={16} strokeWidth={2} />
                {label}
              </span>
              <span className="policies-row-detail">{detail}</span>
              <span className="policies-row-risk">{risk}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Decision rule" className="policies-card">
        <div className="policies-rule">
          <ShieldAlert size={18} strokeWidth={2} />
          <p>
            A request is <strong>ALLOWED</strong> only when its highest
            detected capability risk is below <strong>{RISK_THRESHOLD}</strong>.
            Since every capability above is weighted {RISK_THRESHOLD} or higher,
            detecting <em>any single capability</em> is enough to{" "}
            <strong>DENY</strong> the request outright — there is currently no
            partial-allow path.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
