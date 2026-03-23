import { Link, useNavigate } from "react-router-dom";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";
import logo from "../assets/logo.svg";

export function Header() {
  const { user, isAdmin, logout } = useSimpleAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to={isAdmin ? "/staff/dashboard" : "/portal"} className="flex items-center gap-2">
          <img src={logo} alt="Goods Recycling" className="h-14 w-auto" />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {user && (
            <>
              <span className="text-gray-600 hidden md:block">
                {user.name}
                {isAdmin && (
                  <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                    Staff
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
          {!user && (
            <Link to="/" className="text-emerald-600 hover:text-emerald-800 font-semibold">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
