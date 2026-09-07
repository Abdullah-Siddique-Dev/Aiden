import Avatar from "./Avatar";

export default function AssistantButton({ onClick, isOpen = false }) {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5">
      <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-aiden-surface text-aiden-primary border border-aiden-border shadow-card pointer-events-none select-none">
        <span className="w-2 h-2 rounded-full bg-aiden-accent mr-2 animate-pulse" />
        {isOpen ? "Close Assistant" : "AIDEN AI"}
      </span>
      <button
        onClick={onClick}
        aria-label={isOpen ? "Close AIDEN AI Assistant" : "Open AIDEN AI Assistant"}
        title={isOpen ? "Close AIDEN AI Assistant" : "Open AIDEN AI Assistant"}
        aria-expanded={isOpen}
        className={`group relative rounded-full shadow-modal hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 bg-aiden-surface border-2 ${
          isOpen ? "border-aiden-primary ring-2 ring-aiden-primary/30" : "border-aiden-accent/80 hover:border-aiden-accent"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent focus-visible:ring-offset-2 flex items-center justify-center p-1`}
        style={{ width: 62, height: 62 }}
      >
        <Avatar
          expression={isOpen ? "speaking" : "happy"}
          size={52}
          className="transition-transform group-hover:scale-105 select-none pointer-events-none"
        />
      </button>
    </div>
  );
}
