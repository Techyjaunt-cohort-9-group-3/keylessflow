import profileIcon from "../assets/profile-icon.png";

export default function Navbar({ currentStep }) {
  return (
    <header
      id="site-header"
      className="keyless-navbar bg-white border-b border-slate-200 py-4 px-4 sm:px-6"
    >
      <div className="navbar-inner max-w-6xl mx-auto flex items-center justify-between">
        <div className="navbar-brand-group flex items-center space-x-4 sm:space-x-6">
          <a href="#top" className="brand-wordmark flex flex-col">
            <span className="brand-name font-bold text-lg sm:text-xl text-slate-900 leading-tight tracking-tight">
              Keyless Flow
            </span>
            <span className="brand-property text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Marriott · Lagos
            </span>
          </a>

          <span className="step-badge-desktop hidden sm:inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            Step 0{currentStep} / 03
          </span>
        </div>

        <div className="navbar-actions flex items-center space-x-3 sm:space-x-4">
          <span className="step-badge-mobile sm:hidden text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            0{currentStep} / 03
          </span>

          <button
            type="button"
            className="login-btn text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1.5"
          >
            <img
              src={profileIcon}
              alt="Profile"
              className="w-4 h-4 object-contain"
            />
            <span>Log in</span>
          </button>

          <button
            type="button"
            className="signup-btn bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg transition-colors"
          >
            Sign up for free
          </button>
        </div>
      </div>
    </header>
  );
}
