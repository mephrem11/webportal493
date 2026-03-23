import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home" },
];

export function PublicTabs() {
  return (
    <header className="border-b border-emerald-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Goods Recycling
        </div>
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#2E7D5E] text-white"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`
              }
              end={tab.to === "/"}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
