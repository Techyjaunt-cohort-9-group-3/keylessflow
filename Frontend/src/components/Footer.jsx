import assistanceIcon from "../assets/assistance-icon.png";
import protectIcon from "../assets/protect-icon.png";

export default function Footer() {
  return (
    <footer
      id="site-footer"
      className="keyless-footer bg-white border-t border-slate-200 mt-12 py-6 px-4 sm:px-6"
    >
      <div className="footer-inner max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="footer-left flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span>
            © 2026 Marriott Lagos · Keyless Flow Mobile Check-in Integration
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="inline-flex items-center space-x-1 text-slate-600 font-medium">
            <img
              src={protectIcon}
              alt="Protected"
              className="w-3.5 h-3.5 object-contain"
            />
            <span>Encrypted Booking</span>
          </span>
        </div>

        <div className="footer-links flex flex-wrap items-center justify-center gap-4 font-medium">
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-800"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-800"
          >
            Terms of Service
          </a>
          <a
            href="#support"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-700"
          >
            <img
              src={assistanceIcon}
              alt="Concierge"
              className="w-3.5 h-3.5 object-contain"
            />
            <span>Support &amp; Concierge</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
