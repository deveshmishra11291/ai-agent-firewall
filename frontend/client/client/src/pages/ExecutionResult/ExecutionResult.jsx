import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft, Share2, AlertTriangle, ShieldCheck } from "lucide-react";
import CodeBlock from "../../components/common/CodeBlock.jsx";
import SectionCard from "../../components/common/SectionCard.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { getExecutionById } from "../Execute/executeService.js";
import "./ExecutionResult.css";

const TABS = ["Output", "Logs", "Security Analysis"];

export default function ExecutionResult() {
  const { id } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state ?? null);
  const [activeTab, setActiveTab] = useState(
    location.state?.status === "blocked" ? "Security Analysis" : "Output"
  );

  useEffect(() => {
    if (!result) {
      getExecutionById(id).then((data) => {
        setResult(data);
        setActiveTab(data.status === "blocked" ? "Security Analysis" : "Output");
      });
    }
  }, [id, result]);

  if (!result) {
    return <div className="execution-result-loading">Loading execution result…</div>;
  }

  const isBlocked = result.status === "blocked";
  const riskLevel = result.details?.riskLevel ?? (isBlocked ? "High" : "Low");
  const riskTone = riskLevel.toLowerCase();
  const formattedDate = new Date(result.timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="execution-result">
      <header className="execution-result-topbar">
        <Link to="/execute" className="execution-result-back">
          <ArrowLeft size={15} strokeWidth={2.25} />
          Back to Editor
        </Link>
        <button className="execution-result-share">
          <Share2 size={14} strokeWidth={2.25} />
          Share
        </button>
      </header>

      <div className="execution-result-body">
        <div className="execution-result-heading-row">
          <div>
            <h1>{isBlocked ? "Execution Blocked" : "Execution Result"}</h1>
            <p>
              {isBlocked
                ? "The code was blocked due to security policy violations."
                : "Here's what happened during the execution."}
            </p>
          </div>
          <span className="execution-result-date">{formattedDate}</span>
        </div>

        <div className={"execution-result-banner" + (isBlocked ? " execution-result-banner-danger" : "")}>
          {isBlocked ? (
            <XCircle size={22} strokeWidth={2} />
          ) : (
            <CheckCircle2 size={22} strokeWidth={2} />
          )}
          <div>
            <strong>{isBlocked ? "Execution Blocked" : "Execution Completed Successfully"}</strong>
            <p>{isBlocked ? result.message : "The code ran within the defined policy limits."}</p>
          </div>
          <span className={`execution-risk-badge execution-risk-${riskTone}`}>
            {riskLevel} risk
          </span>
        </div>

        <div className="execution-result-grid">
          <SectionCard className="execution-result-main">
            <div className="execution-result-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? "execution-result-tab execution-result-tab-active" : "execution-result-tab"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="execution-result-tab-panel">
              {activeTab === "Output" && (
                <CodeBlock>{isBlocked ? "No output — execution was blocked before it ran." : result.output}</CodeBlock>
              )}
              {activeTab === "Logs" && <CodeBlock>{result.logs ?? "No logs were recorded for this run."}</CodeBlock>}
              {activeTab === "Security Analysis" && (
                <div className="execution-result-security">
                  {isBlocked ? (
                    <>
                      <div>
                        <h3 className="execution-result-subheading">
                          <AlertTriangle size={15} strokeWidth={2.25} />
                          Detected Threats
                        </h3>
                        {result.threats.map((threat) => (
                          <div className="threat-row" key={threat.title}>
                            <div className="threat-row-head">
                              <span>{threat.title}</span>
                              <StatusPill tone="danger">{threat.severity}</StatusPill>
                            </div>
                            <p>{threat.detail}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 className="execution-result-subheading">
                          <ShieldCheck size={15} strokeWidth={2.25} />
                          Applied Policy
                        </h3>
                        <dl className="detail-list">
                          {result.appliedPolicy.map(({ label, value }) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </>
                  ) : (
                    <div className="execution-clean-summary">
                      <CheckCircle2 size={18} />
                      <div>
                        <strong>No security issues found</strong>
                        <p>Your code stayed within the selected policy and completed safely.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <div className="execution-result-side">
            {isBlocked ? (
              <SectionCard title="Code Snapshot">
                <CodeBlock className="execution-result-snapshot">{result.codeSnapshot}</CodeBlock>
                <p className="execution-result-snapshot-note">
                  <XCircle size={14} strokeWidth={2.25} />
                  This operation is not allowed by the current security policy.
                </p>
              </SectionCard>
            ) : (
              <SectionCard title="Execution Details">
                <dl className="detail-list detail-list-padded">
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <StatusPill tone="success">{result.details.status}</StatusPill>
                    </dd>
                  </div>
                  <div>
                    <dt>Risk Level</dt>
                    <dd><span className={`execution-risk-text execution-risk-${riskTone}`}>{result.details.riskLevel}</span></dd>
                  </div>
                  <div>
                    <dt>Execution Time</dt>
                    <dd>{result.details.executionTime}</dd>
                  </div>
                  <div>
                    <dt>Memory Used</dt>
                    <dd>{result.details.memoryUsed}</dd>
                  </div>
                  <div>
                    <dt>Fuel Consumed</dt>
                    <dd>{result.details.fuelConsumed}</dd>
                  </div>
                  <div>
                    <dt>Filesystem Access</dt>
                    <dd>{result.details.filesystemAccess}</dd>
                  </div>
                  <div>
                    <dt>Network Access</dt>
                    <dd><span className="execution-risk-text execution-risk-low">{result.details.networkAccess}</span></dd>
                  </div>
                  <div>
                    <dt>Exit Code</dt>
                    <dd>{result.details.exitCode}</dd>
                  </div>
                </dl>
              </SectionCard>
            )}

            {isBlocked ? (
              <Link to="/execute" className="execution-result-cta">
                Edit and Retry
              </Link>
            ) : (
              <div className="execution-result-actions">
                <Link to="/execute" className="execution-result-cta-secondary">
                  Run Again
                </Link>
                <button className="execution-result-cta">Download Output</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
