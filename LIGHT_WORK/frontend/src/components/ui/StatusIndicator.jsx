const STATUS_CONFIG = {
  ok: {
    color: "bg-aiden-success",
    ringColor: "ring-aiden-success/30",
    text: "Working",
    textColor: "text-aiden-success",
  },
  working: {
    color: "bg-aiden-success",
    ringColor: "ring-aiden-success/30",
    text: "Working",
    textColor: "text-aiden-success",
  },
  checking: {
    color: "bg-aiden-warning",
    ringColor: "ring-aiden-warning/30",
    text: "Checking…",
    textColor: "text-aiden-warning",
  },
  down: {
    color: "bg-aiden-danger",
    ringColor: "ring-aiden-danger/30",
    text: "Unavailable",
    textColor: "text-aiden-danger",
  },
  unavailable: {
    color: "bg-aiden-danger",
    ringColor: "ring-aiden-danger/30",
    text: "Unavailable",
    textColor: "text-aiden-danger",
  },
};

export function StatusIndicator({
  status = "checking",
  label,
  pulse = true,
  className = "",
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checking;
  const isPending = status === "checking";

  return (
    <span className={`inline-flex items-center gap-2 text-xs select-none ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        {(pulse || isPending) && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
      </span>
      <span className={`font-medium ${config.textColor}`}>
        {label || config.text}
      </span>
    </span>
  );
}

export default StatusIndicator;
