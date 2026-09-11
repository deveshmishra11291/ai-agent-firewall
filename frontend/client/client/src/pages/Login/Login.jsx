import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { createAuthSession } from "../../auth.js";
import "./Login.css";

const STARS = [
  { left: "8%", top: "18%", delay: "0s", size: "2px" },
  { left: "16%", top: "72%", delay: "1.5s", size: "1px" },
  { left: "27%", top: "30%", delay: "3s", size: "2px" },
  { left: "39%", top: "12%", delay: "0.8s", size: "1px" },
  { left: "55%", top: "83%", delay: "2.2s", size: "2px" },
  { left: "68%", top: "22%", delay: "1.1s", size: "1px" },
  { left: "79%", top: "66%", delay: "3.6s", size: "2px" },
  { left: "92%", top: "34%", delay: "2.8s", size: "1px" },
  { left: "3%", top: "49%", delay: "1.4s", size: "2px" },
  { left: "11%", top: "12%", delay: "2.7s", size: "1px" },
  { left: "22%", top: "87%", delay: "0.5s", size: "1px" },
  { left: "34%", top: "21%", delay: "3.8s", size: "2px" },
  { left: "47%", top: "57%", delay: "1.9s", size: "1px" },
  { left: "61%", top: "8%", delay: "0.7s", size: "2px" },
  { left: "74%", top: "48%", delay: "2.9s", size: "1px" },
  { left: "86%", top: "88%", delay: "1.6s", size: "2px" },
  { left: "97%", top: "70%", delay: "0.3s", size: "1px" },
  { left: "2%", top: "67%", delay: "1.1s", size: "1px" },
  { left: "9%", top: "91%", delay: "3.2s", size: "2px" },
  { left: "15%", top: "35%", delay: "0.4s", size: "1px" },
  { left: "21%", top: "5%", delay: "2.3s", size: "2px" },
  { left: "29%", top: "73%", delay: "1.7s", size: "1px" },
  { left: "38%", top: "48%", delay: "3.5s", size: "2px" },
  { left: "53%", top: "17%", delay: "0.2s", size: "1px" },
  { left: "57%", top: "94%", delay: "2.6s", size: "2px" },
  { left: "67%", top: "58%", delay: "1.5s", size: "1px" },
  { left: "72%", top: "31%", delay: "3.9s", size: "2px" },
  { left: "81%", top: "6%", delay: "0.6s", size: "1px" },
  { left: "89%", top: "81%", delay: "2.8s", size: "2px" },
  { left: "94%", top: "43%", delay: "1.3s", size: "1px" },
  { left: "99%", top: "11%", delay: "3.7s", size: "1px" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    createAuthSession(email);
    navigate("/execute");
  };

  return (
    <main className="login">
      <div className="login-noise" aria-hidden="true" />
      <div className="login-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="login-star"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              width: star.size,
              height: star.size,
            }}
          />
        ))}
      </div>
      <section className="login-card">
        <div className="login-mark">
          <ShieldCheck size={21} strokeWidth={2} />
        </div>
        <div className="login-kicker">AI AGENT FIREWALL / ACCESS CONTROL</div>
        <h1>Enter the<br /><span>secure runtime.</span></h1>
        <p className="login-intro">
          A private execution workspace for shipping AI-generated code with
          policy in the loop.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Workspace email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@workspace.dev"
            required
          />
          <label htmlFor="login-password">Passphrase</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            required
          />
          <button type="submit" className="login-submit">
            <span>Continue to workspace</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </form>

        <div className="login-meta">
          <span><KeyRound size={13} /> SSO READY</span>
          <span>SESSION ENCRYPTED</span>
        </div>
      </section>
      <p className="login-footer">No credentials are sent until the auth service is connected.</p>
    </main>
  );
}
