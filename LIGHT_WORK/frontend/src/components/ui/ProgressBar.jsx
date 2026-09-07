const VARIANTS = {
  primary: "bg-aiden-primary",
  accent: "bg-aiden-accent",
  success: "bg-aiden-success",
  danger: "bg-aiden-danger",
};

const HEIGHTS = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  variant = "primary",
  size = "md",
  className = "",
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const barColor = VARIANTS[variant] || VARIANTS.primary;
  const heightClass = HEIGHTS[size] || HEIGHTS.md;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-aiden-text-secondary">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className={`w-full bg-aiden-border-subtle rounded-full overflow-hidden ${heightClass}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
