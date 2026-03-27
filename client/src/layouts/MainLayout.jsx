import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function MainLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-white/10 bg-[#0a0a0a] flex flex-col whitespace-nowrap overflow-hidden`}>
        <div className="p-6 font-bold text-xl tracking-tight flex items-center justify-between">
          <span>NeuroVault</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/dashboard" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Dashboard</Link>
          <Link to="/saved" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/saved') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Saved Items</Link>
          <Link to="/collections" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/collections') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Collections</Link>
          <Link to="/graph" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/graph') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Graph View</Link>
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-sm text-gray-400">Profile</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-white/10 flex items-center px-4 justify-between bg-[#050505]">
          <div className="flex items-center space-x-4 w-full">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <input 
              type="text" 
              placeholder="Search AI, embeddings, queries..." 
              className="flex-1 max-w-xl bg-white/5 px-4 py-2 rounded-xl outline-none text-white placeholder:text-gray-500 border border-transparent focus:border-white/20 transition-all" 
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
