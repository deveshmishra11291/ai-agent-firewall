import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Code2, History as HistoryIcon } from "lucide-react";
import { getExecutionHistory } from "../Execute/executeService.js";
import StatusPill from "../../components/common/StatusPill.jsx";
import "./History.css";

export default function History() {
  const [executions] = useState(getExecutionHistory);

  return (
    <div className="history-page">
      <header className="history-header">
        <div>
          <div className="history-kicker"><HistoryIcon size={13} /> RUN ARCHIVE</div>
          <h1>Execution history</h1>
          <p>Review previous runs, policies, and security decisions.</p>
        </div>
        <span className="history-count">{executions.length} RUNS SAVED</span>
      </header>

      {executions.length === 0 ? (
        <div className="history-empty">
          <Code2 size={22} />
          <strong>No executions yet</strong>
          <p>Your completed runs will appear here.</p>
          <Link to="/execute">Open the execution workspace <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="history-list">
          {executions.map((execution) => {
            const blocked = execution.status === "blocked";
            return (
              <Link className="history-row" to={`/execute/result/${execution.id}`} state={execution} key={execution.id}>
                <div className="history-row-icon"><Code2 size={16} /></div>
                <div className="history-row-main">
                  <strong>{blocked ? "Blocked execution" : "Python analysis run"}</strong>
                  <span>{execution.preset || "Data Analysis"} · {execution.id}</span>
                </div>
                <div className="history-row-time"><Clock3 size={13} /> {new Date(execution.timestamp).toLocaleString()}</div>
                <StatusPill tone={blocked ? "danger" : "success"}>{blocked ? "Blocked" : "Allowed"}</StatusPill>
                <ArrowRight className="history-row-arrow" size={15} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
