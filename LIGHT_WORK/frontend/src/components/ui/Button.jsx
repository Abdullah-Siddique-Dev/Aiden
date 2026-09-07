import { forwardRef } from "react";

const VARIANTS = {
  primary:
    "bg-aiden-primary text-white hover:bg-aiden-primary-hover hover:shadow-sm active:scale-[0.97] shadow-sm border border-transparent",
  secondary:
    "bg-aiden-primary-light text-aiden-primary hover:bg-aiden-primary-subtle hover:border-aiden-primary/40 active:scale-[0.97] border border-aiden-primary/20",
  accent:
    "bg-aiden-accent text-aiden-text-primary hover:bg-aiden-accent-hover hover:shadow-sm active:scale-[0.97] shadow-sm border border-transparent font-semibold",
  outline:
    "bg-transparent text-aiden-primary border border-aiden-primary hover:bg-aiden-primary-light active:scale-[0.97]",
  ghost:
    "bg-transparent text-aiden-text-secondary hover:text-aiden-text-primary hover:bg-aiden-surface-secondary active:scale-[0.97] border border-transparent",
  danger:
    "bg-aiden-danger text-white hover:bg-aiden-danger-hover hover:shadow-sm active:scale-[0.97] shadow-sm border border-transparent",
  success:
    "bg-aiden-success text-white hover:bg-aiden-success/90 hover:shadow-sm active:scale-[0.97] shadow-sm border border-transparent font-semibold",
  ai:
    "bg-gradient-to-r from-aiden-primary to-aiden-primary-hover text-white shadow-sm border border-aiden-accent/30 hover:shadow-card hover:scale-[1.015] active:scale-[0.97]",
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
