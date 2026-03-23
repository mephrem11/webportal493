import logo from "../assets/logo.svg";

export function PublicTabs() {
  return (
    <header className="border-b border-emerald-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-start px-4 py-4 sm:px-6">
        <img src={logo} alt="" className="h-16 w-auto sm:h-20" />
      </div>
    </header>
  );
}
