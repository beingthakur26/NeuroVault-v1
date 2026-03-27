import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, Bookmark, Loader2 } from 'lucide-react'

export default function ItemCard({ item }) {
  const isPending = item.aiStatus === 'pending'
  const navigate = useNavigate()

  return (
    <motion.div 
      onClick={() => navigate(`/item/${item._id}`)}
      whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(255, 255, 255, 0.05)" }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 bg-[#0f0f0f] rounded-2xl border ${isPending ? 'border-indigo-500/50' : 'border-[#222]'} hover:border-white/20 transition-all duration-300 group cursor-pointer overflow-hidden`}
    >
      {/* Background Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isPending ? 'from-indigo-900/20' : 'from-white/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            {item.favicon && <img src={item.favicon} alt="Source" className="w-5 h-5 rounded-sm" />}
            <span className="text-xs text-gray-400 capitalize bg-white/5 px-2 py-1 rounded-md">{item.type}</span>
            {isPending && (
              <span className="flex items-center space-x-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                <span>AI Processing</span>
              </span>
            )}
            {item.aiStatus === 'failed' && (
              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md">Error Processing</span>
            )}
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <Bookmark size={18} />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {item.title}
        </h3>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-3">
          {item.summary || item.content}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags?.map((tag, i) => (
            <span key={i} className="text-xs bg-black text-gray-300 px-2 py-1 rounded-full border border-white/10">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Visit <ExternalLink size={12} className="ml-1" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
