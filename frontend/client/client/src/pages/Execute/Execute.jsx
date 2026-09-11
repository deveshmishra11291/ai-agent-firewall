import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, HardDrive, Wifi, MemoryStick, Cpu, Timer, Play } from "lucide-react";
import CodeEditor from "../../components/common/CodeEditor.jsx";
import SectionCard from "../../components/common/SectionCard.jsx";
import { runExecution, generateAndRun } from "./executeService.js";
import "./Execute.css";

const EXAMPLE_PROMPTS = [
  "Read a CSV and calculate average",
  "Plot a graph from data",
  "Summarize a text file",
];

const DEFAULT_CODE = `import pandas as pd
df = pd.read_csv("data.csv")
average = df["score"].mean()
print(f"Average score: {average}")`;

const PRESET_POLICIES = ["Data Analysis (Recommended)", "Sandbox (Strict)", "Network Enabled"];

// Static preview of the policy that will be applied — mirrors what the
// backend will echo back on the execution result once it's wired up.
const POLICY_PREVIEW = [
  { icon: HardDrive, label: "Filesystem", value: "Allow: data.csv only", risk: "low" },
  { icon: Wifi, label: "Network", value: "Disabled", risk: "low" },
  { icon: MemoryStick, label: "Memory Limit", value: "32 MB", risk: "medium" },
  { icon: Cpu, label: "CPU / Fuel Limit", value: "1,000,000", risk: "medium" },
  { icon: Timer, label: "Execution Timeout", value: "2 seconds", risk: "low" },
];

export default function Execute() {
  const [mode, setMode] = useState("write"); // "write" | "generate"
  const [code, setCode] = useState(DEFAULT_CODE);
  const [preset, setPreset] = useState(PRESET_POLICIES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const navigate = useNavigate();

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const result =
        mode === "generate"
          ? await generateAndRun({ prompt: code, preset })
          : await runExecution({ code, preset });
      navigate(`/execute/result/${result.id}`, { state: result });
    } catch (err) {
      console.error("Execution error:", err);
      alert(`Error: ${err.message || "Failed to execute"}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="execute">
      <header className="execute-header">
        <div>
          <div className="execute-breadcrumb">ARENA / SECURE EXECUTION</div>
          <h1>Execute Code</h1>
          <p>Paste your code or generate it using an AI assistant. We'll analyze, apply policy and run it safely.</p>
        </div>
        <div className="execute-model-select">
          <Sparkles size={15} strokeWidth={2} />
          <select defaultValue="gpt-4el">
            <option value="gpt-4el">GPT-4el</option>
            <option value="gpt-4o">GPT-4o</option>
          </select>
        </div>
      </header>

      <div className="execute-grid">
        <SectionCard className="execute-panel">
          <div className="execute-panel-topline">
            <h2 className="execute-panel-heading">Solution workspace</h2>
            <span className="execute-language">PYTHON 3.11</span>
          </div>

          <div className="execute-tabs">
            <button
              className={mode === "write" ? "execute-tab execute-tab-active" : "execute-tab"}
              onClick={() => setMode("write")}
            >
              Write Code
            </button>
            <button
              className={mode === "generate" ? "execute-tab execute-tab-active" : "execute-tab"}
              onClick={() => setMode("generate")}
            >
              Generate with AI
            </button>
          </div>

          <CodeEditor
            value={code}
            onChange={setCode}
            placeholder={
              mode === "write"
                ? "Paste your code here…"
                : "Describe what you want the code to do…"
            }
          />

          <div className="execute-examples">
            <span className="execute-examples-label">Example Prompts:</span>
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="execute-example-pill"
                onClick={() => setCode(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="execute-panel">
          <div className="execute-panel-topline">
            <h2 className="execute-panel-heading">Run &amp; test</h2>
            <span className="execute-status-dot">READY</span>
          </div>

          <label className="execute-field-label" htmlFor="preset-policy">
            Preset Policy
          </label>
          <select
            id="preset-policy"
            className="execute-preset-select"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            {PRESET_POLICIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <ul className="execute-policy-list">
            {POLICY_PREVIEW.map(({ icon: Icon, label, value, risk }) => (
              <li className={`execute-policy-row execute-policy-row-${risk}`} key={label}>
                <span className="execute-policy-label">
                  <Icon size={15} strokeWidth={2} />
                  {label}
                </span>
                <span className="execute-policy-value">{value}</span>
                <span className="execute-risk-label">{risk}</span>
              </li>
            ))}
          </ul>

          <div className="execute-launch">
            <div className="execute-launch-heading">
              <div>
                <span className="execute-launch-eyebrow">PREFLIGHT GATE</span>
                <strong>{isRunning ? "Inspecting your code" : "Ready to run safely"}</strong>
              </div>
              <span className="execute-launch-signal" aria-hidden="true" />
            </div>
            <p className="execute-launch-copy">
              Policy checks run before the sandbox starts.
            </p>
            <button className="execute-run-button" onClick={handleRun} disabled={isRunning}>
              <span className="execute-run-icon">
                <Play size={15} strokeWidth={2.25} fill="currentColor" />
              </span>
              <span>{isRunning ? "Analyzing…" : "Analyze & Run"}</span>
              <span className="execute-run-arrow">↗</span>
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
