import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-amber-300 text-black">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="text-sm font-semibold tracking-wide">
            Driver&apos;s Klub
          </div>

          {/* Links */}
          <nav className="flex gap-6 text-sm">
            <Link
              to="/terms"
              className="hover:text-black-400 transition"
            >
              Terms & Conditions
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-black-400 transition"
            >
              Privacy Policy
            </Link>
            <Link
              to="/data-protection"
              className="hover:text-black-400 transition"
            >
              Data Protection
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-black/10" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-black/70">
          <span>
            © {new Date().getFullYear()} Tribore Technologies Pvt Ltd
          </span>
          <span>
            All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
