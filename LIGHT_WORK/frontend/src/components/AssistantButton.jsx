import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

// Replaces the old decorative (pointer-events-none) floating avatar.
// Now it's a real button, present on every tab, that jumps straight into
// the AIDEN Assistant conversation inside Chat.
export default function AssistantButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/chat?assistant=1")}
      aria-label="Open AIDEN Assistant"
      className="fixed bottom-4 right-4 z-30 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform bg-white"
      style={{ width: 72, height: 72 }}
    >
      <Avatar expression="happy" size={72} />
    </button>
  );
}
