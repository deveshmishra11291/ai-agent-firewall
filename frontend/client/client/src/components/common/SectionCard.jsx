import "./SectionCard.css";

export default function SectionCard({ title, className = "", children }) {
  return (
    <section className={`section-card ${className}`}>
      {title && <h2 className="section-card-title">{title}</h2>}
      {children}
    </section>
  );
}
