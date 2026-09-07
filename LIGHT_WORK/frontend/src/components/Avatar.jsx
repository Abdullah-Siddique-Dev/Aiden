// Real character images (compressed to ~20KB webp each) replace the old
// hand-drawn SVG avatar. One static image per expression — no more
// procedural animation/bobbing.
const EXPRESSION_IMAGES = {
  idle: "/avatar/idle.webp",
  happy: "/avatar/happy.webp",
  encouraging: "/avatar/encouraging.webp",
  alert: "/avatar/alert.webp",
  listening: "/avatar/listening.webp",
  thinking: "/avatar/thinking.webp",
  speaking: "/avatar/speaking.webp",
  signing: "/avatar/signing.webp",
  hero: "/avatar/hero.webp",
};

export default function Avatar({ expression = "idle", size = 180, className = "" }) {
  const src = EXPRESSION_IMAGES[expression] || EXPRESSION_IMAGES.idle;
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-white shadow-sm ring-2 ring-aiden-border/60 shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt="AIDEN Avatar"
        width={size}
        height={size}
        className="w-full h-full object-cover select-none"
        draggable={false}
      />
    </div>
  );
}
