import { Link, useLocation } from "react-router";
import profileIcon from "../assets/profile-icon.png";

const linkClass =
  "text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900";
const darkButtonClass =
  "bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer";

export default function Navbar({ user, currentStep, onLogout }) {
  const { pathname } = useLocation();
  // The step counter only makes sense on the booking flow (home page)
  const showSteps = pathname === "/";

  return (
    <header
      id="site-header"
      className="keyless-navbar bg-white border-b border-slate-200 py-4 px-4 sm:px-6"
    >
      <div className="navbar-inner max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="navbar-brand-group flex items-center space-x-4 sm:space-x-6">
          <Link to="/" className="brand-wordmark flex flex-col">
            <span className="brand-name font-bold text-lg sm:text-xl text-slate-900 leading-tight tracking-tight">
              Keyless Flow
            </span>
            <span className="brand-property text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Marriott · Lagos
            </span>
          </Link>

          {showSteps && (
            <span className="step-badge-desktop hidden sm:inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
              Step 0{currentStep} / 03
            </span>
          )}
        </div>

        <nav className="navbar-actions flex flex-wrap items-center gap-3 sm:gap-4">
          {showSteps && (
            <span className="step-badge-mobile sm:hidden text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              0{currentStep} / 03
            </span>
          )}

          {!user && (
            <>
              <Link
                to="/login"
                className={`login-btn ${linkClass} flex items-center space-x-1.5`}
              >
                <img
                  src={profileIcon}
                  alt="Profile"
                  className="w-4 h-4 object-contain"
                />
                <span>Log in</span>
              </Link>

              <Link to="/register" className={`signup-btn ${darkButtonClass}`}>
                Sign up for free
              </Link>
            </>
          )}

          {user?.type === "guest" && (
            <>
              <Link to="/bookings" className={linkClass}>
                My bookings
              </Link>
              <Link to="/notifications" className={linkClass}>
                Notifications
              </Link>
            </>
          )}

          {user?.type === "staff" && (
            <Link to="/staff" className={linkClass}>
              Dashboard
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/profile"
                className={`${linkClass} flex items-center space-x-1.5`}
              >
                <img
                  src={profileIcon}
                  alt="Profile"
                  className="w-4 h-4 object-contain"
                />
                <span>{user.firstName}</span>
              </Link>
              <button type="button" onClick={onLogout} className={darkButtonClass}>
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
