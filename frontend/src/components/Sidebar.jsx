import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, Sparkles, Settings, Bookmark } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/graph', icon: Network, label: 'Knowledge Graph' },
    { to: '/resurface', icon: Sparkles, label: 'Resurfacing' },
  ];

  return (
    <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0d0d0e]">
      <div className="p-6">
        <div className="flex items-center gap-3 text-indigo-400">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Second Brain</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-indigo-500/10 text-indigo-400' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <link.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
