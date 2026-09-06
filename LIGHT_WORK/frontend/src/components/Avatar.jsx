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
    <img
      src={src}
      alt="AIDEN"
      width={size}
      height={size}
      className={`select-none object-contain ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
