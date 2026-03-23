import logo from "../assets/logo.svg";

export function PublicTabs() {
  return (
    <header className="border-b border-emerald-200 bg-white/95 backdrop-blur">
      <div className="flex w-full items-center justify-start gap-3 px-4 py-4 sm:px-6">
        <img src={logo} alt="Goods Recycling logo" className="h-16 w-auto sm:h-20" />
        <div className="text-3xl font-extrabold uppercase tracking-wide text-emerald-700 sm:text-4xl">
          Goods Reclying
        </div>
      </div>
    </header>
  );
}
