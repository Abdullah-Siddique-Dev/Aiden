const VARIANTS = {
  default:
    "bg-aiden-surface-secondary text-aiden-text-secondary border-aiden-border",
  primary:
    "bg-aiden-primary-light text-aiden-primary border-aiden-primary/25",
  accent:
    "bg-aiden-accent-light text-aiden-text-primary border-aiden-accent/40 font-medium",
  success:
    "bg-aiden-success-light text-aiden-success border-aiden-success/25",
  danger:
    "bg-aiden-danger-light text-aiden-danger border-aiden-danger/25",
  warning:
    "bg-aiden-warning-light text-aiden-warning border-aiden-warning/25",
  ai:
    "bg-gradient-to-r from-aiden-primary-light to-aiden-accent-light text-aiden-primary border-aiden-accent/40 font-semibold",
};

const SIZES = {
  sm: "text-[11px] px-2 py-0.5 rounded-full gap-1",
  md: "text-xs px-2.5 py-1 rounded-full gap-1.5",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  icon = null,
  className = "",
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <span
      className={`inline-flex items-center font-medium border select-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
