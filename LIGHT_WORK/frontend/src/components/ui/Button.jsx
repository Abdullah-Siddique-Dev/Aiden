import { forwardRef } from "react";

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-aiden-primary to-aiden-primary-hover text-white shadow-[0_2px_8px_rgba(47,111,94,0.25)] hover:shadow-[0_4px_14px_rgba(47,111,94,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-aiden-primary/30 font-semibold",
  secondary:
    "bg-white text-aiden-primary hover:bg-aiden-primary-light/60 hover:border-aiden-primary/50 active:scale-[0.98] border border-aiden-border shadow-subtle font-medium",
  accent:
    "bg-gradient-to-r from-aiden-accent to-aiden-accent-hover text-aiden-text-primary shadow-[0_2px_8px_rgba(232,180,79,0.3)] hover:shadow-[0_4px_14px_rgba(232,180,79,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-aiden-accent-hover/30 font-bold",
  outline:
    "bg-transparent text-aiden-primary border border-aiden-primary/60 hover:bg-aiden-primary-light hover:border-aiden-primary active:scale-[0.98] font-medium",
  ghost:
    "bg-transparent text-aiden-text-secondary hover:text-aiden-text-primary hover:bg-aiden-surface-secondary active:scale-[0.98] border border-transparent font-medium",
  danger:
    "bg-gradient-to-r from-aiden-danger to-aiden-danger-hover text-white shadow-[0_2px_8px_rgba(194,59,107,0.25)] hover:shadow-[0_4px_14px_rgba(194,59,107,0.35)] hover:-translate-y-0.5 active:scale-[0.98] border border-transparent font-semibold",
  success:
    "bg-gradient-to-r from-aiden-success to-aiden-success/90 text-white shadow-[0_2px_8px_rgba(46,125,91,0.25)] hover:shadow-[0_4px_14px_rgba(46,125,91,0.35)] hover:-translate-y-0.5 active:scale-[0.98] border border-transparent font-semibold",
  ai:
    "bg-gradient-to-r from-aiden-primary via-[#245849] to-aiden-primary text-white shadow-[0_4px_14px_rgba(47,111,94,0.3)] hover:shadow-[0_6px_20px_rgba(47,111,94,0.45)] hover:-translate-y-0.5 active:scale-[0.98] border border-aiden-accent/40 font-bold",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-aiden-sm min-h-[36px]",
  md: "px-4 py-2.5 text-sm font-medium rounded-aiden-md min-h-[44px]",
  lg: "px-6 py-3.5 text-base font-semibold rounded-aiden-lg min-h-[50px]",
  icon: "p-2.5 rounded-full min-w-[42px] min-h-[42px] flex items-center justify-center",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    icon = null,
    className = "",
    type = "button",
    onClick,
    title,
    "aria-label": ariaLabel,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 select-none cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent focus-visible:ring-offset-2 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});

export default Button;
