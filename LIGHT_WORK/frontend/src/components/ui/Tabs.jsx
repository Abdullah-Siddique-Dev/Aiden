export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = "pills",
  className = "",
  size = "md",
}) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={`flex border-b border-aiden-border bg-aiden-surface overflow-x-auto no-scrollbar shrink-0 ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-2 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent focus-visible:ring-offset-2 ${
                isActive
                  ? "border-aiden-primary text-aiden-primary font-semibold"
                  : "border-transparent text-aiden-text-secondary hover:text-aiden-text-primary hover:border-aiden-border"
              }`}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-aiden-primary-light text-aiden-primary">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap items-center gap-1.5 p-1 bg-aiden-surface-secondary border border-aiden-border rounded-aiden-md select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-aiden-sm transition-all duration-150 flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent ${
              isActive
                ? "bg-aiden-primary text-white shadow-sm font-semibold"
                : "text-aiden-text-secondary hover:text-aiden-text-primary hover:bg-aiden-surface/70"
            }`}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-aiden-border text-aiden-text-secondary"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
