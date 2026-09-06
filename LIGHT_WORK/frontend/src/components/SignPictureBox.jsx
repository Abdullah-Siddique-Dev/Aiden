import { signImageFor } from "../lib/signImages";

// size in px. Shows the real picture if one has been added to signImages.js,
// otherwise an honest placeholder (never a fake/generic stand-in).
export default function SignPictureBox({ id, label, size = 180 }) {
  const src = signImageFor(id);
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-card border hairline bg-white flex items-center justify-center overflow-hidden shrink-0"
    >
      {src ? (
        <img src={src} alt={label || id} className="w-full h-full object-contain" />
      ) : (
        <div className="text-center px-3">
          <span className="text-3xl" aria-hidden>🖼️</span>
          <p className="text-xs text-ink/40 mt-1">{label || id}</p>
        </div>
      )}
    </div>
  );
}
