import { useRef } from "react";
import "./CodeEditor.css";

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightPython(value) {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/(#[^\n]*)/g, '<span class="syntax-comment">$1</span>')
    .replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="syntax-string">$1</span>')
    .replace(/\b(import|from|as|def|return|if|else|elif|for|in|while|True|False|None|and|or|not|try|except|with|class)\b/g, '<span class="syntax-keyword">$1</span>')
    .replace(/\b(print|len|range|sum|open|str|int|float|list|dict|set)\b/g, '<span class="syntax-builtin">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syntax-number">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="syntax-function">$1</span>');
}

export default function CodeEditor({ value, onChange, placeholder }) {
  const gutterRef = useRef(null);
  const codeRef = useRef(null);
  const lines = value.split("\n").length;

  // Keep the line-number gutter's scroll position in sync with the textarea.
  const handleScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
    if (codeRef.current) {
      codeRef.current.scrollTop = e.target.scrollTop;
      codeRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  return (
    <div className="code-editor">
      <div className="code-editor-gutter" ref={gutterRef}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div className="code-editor-body">
        <pre
          className="code-editor-highlight"
          ref={codeRef}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightPython(value) || " " }}
        />
        <textarea
          className="code-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
