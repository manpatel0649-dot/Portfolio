interface TagProps {
  children: React.ReactNode;
  variant?: "default" | "em";
}

export default function Tag({ children, variant = "default" }: TagProps) {
  return (
    <span className={`tag${variant === "em" ? " tag-em" : ""}`}>
      {children}
    </span>
  );
}
