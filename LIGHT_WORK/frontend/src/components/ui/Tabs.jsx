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
        className={`flex border-b border-aiden-border/80 bg-aiden-surface/90 backdrop-blur-sm overflow-x-auto no-scrollbar shrink-0 ${className}`}
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
                  ? "border-aiden-primary text-aiden-primary font-bold shadow-[0_1px_0_0_var(--aiden-primary)]"
                  : "border-transparent text-aiden-text-secondary hover:text-aiden-text-primary hover:border-aiden-border"
              }`}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-aiden-primary-light text-aiden-primary font-semibold">
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
      className={`inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-aiden-surface-secondary/90 border border-aiden-border/80 rounded-aiden-lg shadow-subtle select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-xs sm:text-sm rounded-aiden-md transition-all duration-150 flex items-center gap-2 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aiden-accent ${
              isActive
                ? "bg-gradient-to-r from-aiden-primary to-aiden-primary-hover text-white shadow-sm font-semibold"
                : "text-aiden-text-secondary hover:text-aiden-text-primary hover:bg-white/80 font-medium"
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
