import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    helperText,
    icon = null,
    className = "",
    type = "text",
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs sm:text-sm font-medium text-aiden-text-secondary select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-aiden-danger ml-0.5">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-aiden-text-muted pointer-events-none flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full bg-aiden-surface text-aiden-text-primary text-sm rounded-aiden-md border transition-all duration-150 py-2.5 px-3.5 ${
            icon ? "pl-10" : ""
          } ${
            error
              ? "border-aiden-danger focus:border-aiden-danger focus:ring-2 focus:ring-aiden-danger/20"
              : "border-aiden-border hover:border-aiden-primary/50 focus:border-aiden-primary focus:ring-2 focus:ring-aiden-primary/20"
          } disabled:bg-aiden-surface-secondary disabled:text-aiden-text-muted disabled:cursor-not-allowed outline-none ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-aiden-danger font-medium mt-0.5 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-aiden-danger shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-aiden-text-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
