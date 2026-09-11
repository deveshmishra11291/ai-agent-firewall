import "./CodeBlock.css";

export default function CodeBlock({ children, className = "" }) {
  return <pre className={`code-block ${className}`}>{children}</pre>;
}
