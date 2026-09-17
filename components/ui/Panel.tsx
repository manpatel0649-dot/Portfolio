interface PanelProps {
  children: React.ReactNode;
  barLeft?: React.ReactNode;
  barRight?: React.ReactNode;
  corner?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function Panel({
  children,
  barLeft,
  barRight,
  corner = false,
  className = "",
  style,
}: PanelProps) {
  return (
    <div
      className={`panel${corner ? " corner" : ""}${className ? " " + className : ""}`}
      style={style}
    >
      {(barLeft || barRight) && (
        <div className="bar">
          <span>{barLeft}</span>
          <span>{barRight}</span>
        </div>
      )}
      {children}
    </div>
  );
}
