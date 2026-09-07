import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  className = "",
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = MAX_WIDTHS[maxWidth] || MAX_WIDTHS.md;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aiden-text-primary/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        ref={dialogRef}
        className={`w-full ${widthClass} bg-aiden-surface rounded-aiden-xl border border-aiden-border shadow-modal overflow-hidden flex flex-col max-h-[90vh] ${className}`}
      >
        {(title || onClose) && (
          <div className="px-5 py-4 border-b border-aiden-border flex items-center justify-between shrink-0">
            <div>
              {title && (
                <h2 id="modal-title" className="font-display text-lg font-semibold text-aiden-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-aiden-text-secondary mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-aiden-text-muted hover:text-aiden-text-primary hover:bg-aiden-surface-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 bg-aiden-surface-secondary/50 border-t border-aiden-border flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
