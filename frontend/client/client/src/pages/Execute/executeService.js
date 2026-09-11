const API_BASE = "http://127.0.0.1:8000";
const HISTORY_STORAGE_KEY = "ai-firewall-execution-history";

function readHistory() {
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveExecution(result) {
  const history = [result, ...readHistory()].slice(0, 30);
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  return result;
}

export function getExecutionHistory() {
  return readHistory();
}

export async function getExecutionById(id) {
  const savedResult = readHistory().find((execution) => execution.id === id);
  if (savedResult) return savedResult;
  throw new Error("Execution not found in local history.");
}

export async function runExecution({ code, preset }) {
  const res = await fetch(`${API_BASE}/api/execute-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, preset }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Execution request failed");
  }

  const result = await res.json();
  return saveExecution(result);
}

function riskLevel(riskScore) {
  if (riskScore >= 80) return "Critical";
  if (riskScore >= 50) return "High";
  if (riskScore >= 1) return "Medium";
  return "Low";
}

function capabilityLabel(capability) {
  return capability.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function appliedPolicy(policy) {
  return [
    { label: "Network Access", value: policy.network ? "Allowed" : "Disabled" },
    { label: "Filesystem Read", value: policy.filesystem_read ? "Allowed" : "Disabled" },
    { label: "Filesystem Write", value: policy.filesystem_write ? "Allowed" : "Disabled" },
    { label: "Process Execution", value: policy.process_execution ? "Allowed" : "Disabled" },
    { label: "Dynamic Execution", value: policy.dynamic_execution ? "Allowed" : "Disabled" },
  ];
}

export async function generateAndRun({ prompt, preset }) {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Generation request failed");
  }

  const data = await res.json();
  const { security, policy, execution, code, explanation } = data;
  const risk = riskLevel(security.risk_score);
  const id = "exec_" + Date.now();
  const timestamp = new Date().toISOString();

  if (policy.decision !== "ALLOW") {
    const threats = security.capabilities.map((capability) => ({
      title: capabilityLabel(capability),
      severity: risk,
      detail:
        security.findings.find((f) => f.toLowerCase().includes(capability.replace(/_/g, " "))) ||
        `Detected capability: ${capabilityLabel(capability)}`,
    }));
    return saveExecution({
      id,
      status: "blocked",
      timestamp,
      message: "The generated code was blocked by the security policy before execution.",
      codeSnapshot: code,
      generatedCode: code,
      explanation,
      threats: threats.length ? threats : [{ title: "Blocked", severity: risk, detail: "Execution blocked by policy." }],
      preset,
      appliedPolicy: appliedPolicy(policy),
      security,
      policy,
    });
  }

  const fsAccess = policy.filesystem_read || policy.filesystem_write ? "Allowed" : "Denied";
  const netAccess = policy.network ? "Allowed" : "Denied";

  return saveExecution({
    id,
    status: execution.success ? "success" : "error",
    timestamp,
    preset,
    generatedCode: code,
    explanation,
    output: execution.output || "",
    logs: execution.error || "No warnings or errors were logged during this run.",
    details: {
      status: execution.success ? "Allowed" : "Error",
      riskLevel: risk,
      executionTime: `${execution.execution_time_ms} ms`,
      memoryUsed: "n/a",
      fuelConsumed: execution.fuel_used.toLocaleString(),
      filesystemAccess: fsAccess,
      networkAccess: netAccess,
      exitCode: execution.success ? 0 : 1,
    },
    security,
    policy,
  });
}
