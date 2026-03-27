import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { ExternalLink, Tag } from 'lucide-react'

export default function SharedCollection() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchShared = async () => {
      try {
        // Unauthenticated call
        const res = await axios.get(`http://localhost:5000/api/public/collections/${id}`)
        setData(res.data)
      } catch (err) {
        console.error(err)
        setError("This collection is either private or doesn't exist.")
      } finally {
        setLoading(false)
      }
    }
    fetchShared()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <span>Loading Shared Collection...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-300">Access Denied</h1>
        <p className="text-gray-500 max-w-md">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b border-white/10 pb-8 cursor-default">
          <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs uppercase tracking-wider text-gray-400 mb-4">
            Public View
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            {data.collection.name}
          </h1>
          <p className="text-gray-500 text-lg">Shared via NeuroVault Second Brain</p>
        </header>

        {data.items.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/10">
            This collection is empty.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((item) => (
              <div 
                key={item._id} 
                className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col h-72 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                
                <div className="flex items-start justify-between mb-4 z-10">
                  <div className="flex items-center space-x-3 truncate">
                    {item.favicon && <img src={item.favicon} alt="icon" className="w-6 h-6 rounded shrink-0" />}
                    <span className="text-xs font-medium px-2 py-1 bg-white/5 text-gray-300 rounded uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" title="Visit source">
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>

                <h3 className="text-xl font-bold leading-tight mb-3 text-white group-hover:text-blue-400 transition-colors line-clamp-2 z-10">
                  {item.title}
                </h3>
                
                {item.summary && (
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4 leading-relaxed z-10 flex-grow">
                    {item.summary}
                  </p>
                )}

                {!item.summary && item.content && (
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4 font-mono z-10 flex-grow">
                    {item.content.replace(/[#*`~]/g, '')}
                  </p>
                )}

                {item.tags?.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0 z-10 mt-auto">
                    <Tag size={12} className="text-gray-500" />
                    {item.tags.map(t => (
                      <span key={t} className="text-xs text-gray-400 whitespace-nowrap bg-black px-2 py-1 border border-white/5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
