interface BtnProps {
  href?: string;
  variant?: "pri" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}

export default function Btn({
  href,
  variant = "pri",
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
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
    <button type={type} onClick={onClick} className={cls} disabled={disabled} aria-disabled={disabled}>
      {children}
    </button>
  );
}
