interface LabelProps {
  number?: string;
  children: React.ReactNode;
}

export default function Label({ number, children }: LabelProps) {
  return (
    <div className="section-label">
      {number && <b>{number}</b>}
      {children}
    </div>
  );
}
