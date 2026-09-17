interface BtnProps {
  href?: string;
  variant?: "pri" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

export default function Btn({
  href,
  variant = "pri",
  children,
  onClick,
  type = "button",
  className = "",
}: BtnProps) {
  const cls = `btn btn-${variant} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
