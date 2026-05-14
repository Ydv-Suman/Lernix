import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const authenticatedNavItems = [
  { to: '/courses', label: 'Courses' },
  { to: '/insights', label: 'Insights' },
  { to: '/recommendations', label: 'Recommendations' },
  { to: '/about', label: 'About' },
];

const publicNavItems = [{ to: '/about', label: 'About' }];

const baseNavItemClass =
  'rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] transition-all duration-200';

const getNavLinkClassName = ({ isActive }) =>
  `${baseNavItemClass} ${
    isActive
      ? 'bg-[#ff6b35] text-white shadow-[0_12px_30px_rgba(255,107,53,0.24)]'
      : 'text-slate-600 hover:bg-white hover:text-slate-900'
  }`;

const NavBar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || user?.email || 'Account';
  };

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-40 border-b border-[#d8ddd7]/80 bg-[#f7f4ed]/90 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to={isAuthenticated ? '/courses' : '/about'}
            className="group inline-flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f5c5b] text-lg font-bold text-white shadow-[0_16px_40px_rgba(31,92,91,0.24)]">
              L
            </span>
            <div className="min-w-0">
              <p className="text-xl font-extrabold tracking-[-0.04em] text-slate-900">Lernix</p>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                Learn with focus
              </p>
            </div>
          </Link>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-[#d6ddd7] bg-[#eef2ed] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={getNavLinkClassName}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-[#d6ddd7] bg-white/95 px-3 py-2 text-left shadow-[0_14px_28px_rgba(15,23,42,0.08)] transition hover:border-[#1f5c5b]/25 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12)]"
                type="button"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f5c5b] text-sm font-bold uppercase text-white">
                  {getUserDisplayName().charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block max-w-40 truncate text-sm font-semibold text-slate-900">
                    {getUserDisplayName()}
                  </span>
                  <span className="block max-w-40 truncate text-xs text-slate-500">
                    {user?.email || 'Signed in'}
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-3xl border border-[#d6ddd7] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{getUserDisplayName()}</p>
                    {user?.email && <p className="mt-1 text-sm text-slate-500">{user.email}</p>}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-4 text-left text-sm font-semibold text-[#b33b17] transition hover:bg-[#fff2ed]"
                    type="button"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-full bg-[#1f5c5b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(31,92,91,0.24)] transition hover:bg-[#184b4a]"
              >
                Create account
              </NavLink>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d6ddd7] bg-white text-slate-700 shadow-[0_14px_28px_rgba(15,23,42,0.08)] md:hidden"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-[#d8ddd7] bg-[#f7f4ed] px-4 pb-5 pt-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClassName}>
                {item.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <div className="mt-3 rounded-3xl border border-[#d6ddd7] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-semibold text-slate-900">{getUserDisplayName()}</p>
                {user?.email && <p className="mt-1 text-sm text-slate-500">{user.email}</p>}
                <button
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-2xl bg-[#fff2ed] px-4 py-3 text-sm font-semibold text-[#b33b17]"
                  type="button"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                <NavLink
                  to="/login"
                  className="rounded-2xl border border-[#d6ddd7] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-2xl bg-[#1f5c5b] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Create account
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
