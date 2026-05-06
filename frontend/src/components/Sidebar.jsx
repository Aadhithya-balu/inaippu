import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Sidebar = ({ links }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => {
    if (path.endsWith('/') || path.split('/').length <= 2) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-1 p-4 pt-6">
      {links.map(link => (
        <Link key={link.path} to={link.path} onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
            ${isActive(link.path)
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
          {link.icon}
          {link.label}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed bottom-24 left-4 z-50 bg-slate-900 text-white p-3 rounded-full shadow-xl"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <aside className="w-64 h-full bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <NavLinks />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 bg-white border-r border-slate-100 shrink-0">
        <NavLinks />
      </aside>
    </>
  );
};

export default Sidebar;
