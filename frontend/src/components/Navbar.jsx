import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Search, Plus } from 'lucide-react';

const Navbar = ({ onSearch, onAdd }) => {
  return (
    <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search your brain..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Save Item</span>
        </button>
        <div className="h-8 w-px bg-white/10 mx-2" />
        <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-9 h-9 border border-white/20' } }} />
      </div>
    </nav>
  );
};

export default Navbar;
