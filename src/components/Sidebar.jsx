import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLogout, useMe } from '../hooks/useAuth';
import Icon from './Icon';

const LINKS = [
  { to: '/', label: 'Tasks', icon: 'tasks', end: true },
  { to: '/today', label: 'Today', icon: 'calendar' },
  { to: '/timelogs', label: 'Time Logs', icon: 'clock' },
  { to: '/insights', label: 'Insights', icon: 'chart' },
];

export default function Sidebar() {
  const { data: user } = useMe();
  const logout = useLogout();
  const location = useLocation();
  // One isolated flag, so useState is enough here
  const [menuOpen, setMenuOpen] = useState(false);
  const firstLinkRef = useRef(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const initial = user?.name?.trim()[0]?.toUpperCase() || '?';

  return <>
    <aside className="sidebar-rail" aria-label="Main navigation">
      <Link to="/" className="rail-brand" aria-label="TaskTracker home" title="TaskTracker">T</Link>
      <nav className="rail-nav">
        {LINKS.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className="sidebar-link" aria-label={link.label} title={link.label}>
          <Icon name={link.icon} size={22} />
        </NavLink>)}
      </nav>
      <div className="rail-bottom">
        <span className="avatar" title={user?.name} aria-label={`Signed in as ${user?.name}`}>{initial}</span>
        <button type="button" className="sidebar-link" onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="Log out" title="Log out">
          <Icon name="logout" size={22} />
        </button>
      </div>
    </aside>

    <header className="topbar">
      <Link to="/" className="topbar-brand"><span className="rail-brand small">T</span>TaskTracker</Link>
      <button type="button" className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} aria-controls="app-menu">
        <Icon name="menu" size={24} />
      </button>
    </header>

    {menuOpen && <>
      <div id="app-menu" className="offcanvas offcanvas-start show app-offcanvas" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="offcanvas-header">
          <span className="topbar-brand"><span className="rail-brand small">T</span>TaskTracker</span>
          <button type="button" className="btn-close" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
        </div>
        <nav className="offcanvas-body menu-links">
          {LINKS.map((link, index) => <NavLink key={link.to} to={link.to} end={link.end} className="menu-link" ref={index === 0 ? firstLinkRef : undefined}
            onClick={() => setMenuOpen(false)}>
            <Icon name={link.icon} />{link.label}
          </NavLink>)}
        </nav>
        <div className="menu-footer">
          <span className="avatar">{initial}</span>
          <span className="menu-user text-truncate">{user?.name}</span>
          <button type="button" className="btn btn-light btn-sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      </div>
      <div className="offcanvas-backdrop fade show" onClick={() => setMenuOpen(false)} />
    </>}
  </>;
}
