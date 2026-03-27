import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Menu, X, BrainCircuit, Search } from 'lucide-react'

export default function MainLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const isActive = (path) => location.pathname === path

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsMobileMenuOpen(false)
      navigate(`/saved?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Saved Items', path: '/saved' },
    { name: 'Collections', path: '/collections' },
    { name: 'AI Chat', path: '/chat' },
    { name: 'Graph View', path: '/graph' },
    { name: 'Profile', path: '/profile' }
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Fixed Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 h-16">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                <BrainCircuit size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white hidden sm:block">NeuroVault</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path) 
                      ? 'bg-white/10 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Minimal Search Bar in Navbar */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queries..." 
                className="w-48 lg:w-64 bg-white/5 pl-10 pr-4 py-1.5 rounded-full outline-none text-sm text-white placeholder:text-gray-500 border border-white/5 focus:border-white/20 transition-all" 
              />
            </form>

            {/* User Profile */}
            <UserButton afterSignOutUrl="/" />

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 w-full bg-[#0a0a0a] border-b border-white/10 z-40 md:hidden flex flex-col px-4 py-4 space-y-2 shadow-2xl">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                isActive(link.path) 
                  ? 'bg-indigo-500/20 text-indigo-300' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <form onSubmit={handleSearch} className="pt-4 border-t border-white/10 mt-2 relative">
              <Search size={16} className="absolute left-3 top-7 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="w-full bg-white/5 pl-10 pr-4 py-2 rounded-xl outline-none text-white border border-white/5 focus:border-indigo-500 transition-all" 
              />
          </form>
        </div>
      )}

      {/* Main Content Area (padding-top offsets fixed navbar) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {children}
      </main>
    </div>
  )
}
