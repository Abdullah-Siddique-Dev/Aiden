import { signImageFor } from "../lib/signImages";
import { Hand } from "lucide-react";

export default function SignPictureBox({ id, label, size = 190 }) {
  const src = signImageFor(id);
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-2xl border-2 border-aiden-border/70 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-card relative group transition-all duration-200 hover:border-aiden-primary/50"
    >
      {src ? (
        <img
          src={src}
          alt={label || id}
          className="w-full h-full object-cover select-none transition-transform duration-200 group-hover:scale-105"
          loading="eager"
        />
      ) : (
        <div className="text-center px-3 select-none">
          <Hand className="w-8 h-8 text-aiden-primary/60 mx-auto" aria-hidden="true" />
          <p className="text-xs text-aiden-text-muted mt-1 font-medium">{label || id}</p>
        </div>
      )}
    </div>
  );
}

