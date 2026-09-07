import { signImageFor } from "../lib/signImages";
import { Hand } from "lucide-react";

export default function SignPictureBox({ id, label, size = 180 }) {
  const src = signImageFor(id);
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-aiden-lg border border-aiden-border bg-aiden-surface flex items-center justify-center overflow-hidden shrink-0 shadow-subtle"
    >
      {src ? (
        <img src={src} alt={label || id} className="w-full h-full object-contain" />
      ) : (
        <div className="text-center px-3 select-none">
          <Hand className="w-8 h-8 text-aiden-primary/60 mx-auto" aria-hidden="true" />
          <p className="text-xs text-aiden-text-muted mt-1 font-medium">{label || id}</p>
        </div>
      )}
    </div>
  );
}

