import { forwardRef } from "react";

const VARIANTS = {
  standard:
    "bg-aiden-surface border border-aiden-border/80 rounded-aiden-xl shadow-card transition-all duration-200",
  interactive:
    "bg-aiden-surface border border-aiden-border/80 rounded-aiden-xl shadow-card hover:shadow-card-hover hover:border-aiden-primary/60 hover:-translate-y-1 transition-all duration-200 cursor-pointer active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent",
  subtle:
    "bg-aiden-surface-secondary/80 border border-aiden-border-subtle rounded-aiden-xl transition-colors",
  accent:
    "bg-gradient-to-br from-aiden-accent-light/60 to-aiden-accent-light/20 border border-aiden-accent/40 rounded-aiden-xl shadow-card",
  camera:
    "bg-black rounded-aiden-xl overflow-hidden border border-aiden-border/80 relative shadow-card",
  ai:
    "bg-gradient-to-br from-white via-aiden-primary-subtle/50 to-aiden-accent-subtle/30 border border-aiden-primary/30 rounded-aiden-xl shadow-card hover:border-aiden-accent/60 transition-all duration-200",
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
