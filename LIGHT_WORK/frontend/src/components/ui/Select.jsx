import { forwardRef } from "react";

export const Select = forwardRef(function Select(
  {
    id,
    label,
    error,
    helperText,
    className = "",
    children,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  const errorId = selectId ? `${selectId}-error` : undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs sm:text-sm font-medium text-aiden-text-secondary select-none"
        >
          {label}
          {required && <span className="text-aiden-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full appearance-none bg-aiden-surface text-aiden-text-primary text-sm rounded-aiden-md border transition-all duration-150 py-2.5 px-3.5 pr-10 ${
            error
              ? "border-aiden-danger focus:border-aiden-danger focus:ring-2 focus:ring-aiden-danger/20"
              : "border-aiden-border hover:border-aiden-primary/50 focus:border-aiden-primary focus:ring-2 focus:ring-aiden-primary/20"
          } disabled:bg-aiden-surface-secondary disabled:text-aiden-text-muted disabled:cursor-not-allowed outline-none cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3.5 flex items-center text-aiden-text-secondary" aria-hidden="true">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-aiden-danger font-medium mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-aiden-text-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
