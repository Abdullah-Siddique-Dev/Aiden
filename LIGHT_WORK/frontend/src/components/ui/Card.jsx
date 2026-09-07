import { forwardRef } from "react";

const VARIANTS = {
  standard:
    "bg-aiden-surface border border-aiden-border rounded-aiden-lg shadow-subtle transition-all duration-200",
  interactive:
    "bg-aiden-surface border border-aiden-border rounded-aiden-lg shadow-subtle hover:shadow-card-hover hover:border-aiden-primary/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent",
  subtle:
    "bg-aiden-surface-secondary border border-aiden-border-subtle rounded-aiden-lg transition-colors",
  accent:
    "bg-aiden-accent-light/40 border border-aiden-accent/30 rounded-aiden-lg shadow-subtle",
  camera:
    "bg-black rounded-aiden-lg overflow-hidden border border-aiden-border relative shadow-card",
  ai:
    "bg-gradient-to-br from-aiden-surface to-aiden-primary-subtle border border-aiden-primary/25 rounded-aiden-lg shadow-subtle hover:border-aiden-accent/40 transition-all duration-200",
};

const PADDINGS = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6 sm:p-8",
};

export const Card = forwardRef(function Card(
  {
    children,
    variant = "standard",
    padding = "md",
    className = "",
    as: Component = "div",
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.standard;
  const paddingClass = PADDINGS[padding] ?? PADDINGS.md;

  return (
    <Component
      ref={ref}
      className={`${variantClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Card;
