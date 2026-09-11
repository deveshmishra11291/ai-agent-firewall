import { NavLink, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Play,
  History,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { clearAuthSession, getAuthSession } from "../../auth.js";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/execute", label: "Execute", icon: Play },
  { to: "/history", label: "History", icon: History },
  { to: "/policies", label: "Policies", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const currentUser = getAuthSession() ?? { name: "User", email: "user@example.com" };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">
          <ShieldCheck size={20} strokeWidth={2.25} />
        </span>
        <span className="sidebar-brand-text">
          AI Agent <span className="sidebar-brand-accent">Firewall</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link-active" : "")
            }
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <span className="sidebar-user-avatar">
          {currentUser.name.charAt(0).toUpperCase()}
        </span>
        <div className="sidebar-user-meta">
          <span className="sidebar-user-name">{currentUser.name}</span>
          <span className="sidebar-user-email">{currentUser.email}</span>
        </div>
        <button className="sidebar-logout" type="button" onClick={handleLogout} aria-label="Log out">
          <LogOut size={15} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
