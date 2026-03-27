import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { Trash2, ExternalLink, ArrowLeft, Tag, FolderPlus } from 'lucide-react'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  
  const [item, setItem] = useState(null)
  const [collections, setCollections] = useState([])
  const [showColMenu, setShowColMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchItemAndCols = async () => {
      try {
        const token = await getToken()
        const [itemRes, colRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:5000/api/collections`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        setItem(itemRes.data.item)
        setCollections(colRes.data.collections)
      } catch (_) {
        setError('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    fetchItemAndCols()
  }, [id, getToken])

  const handleAddToCollection = async (collectionId) => {
    try {
      const token = await getToken()
      await axios.post(`http://localhost:5000/api/collections/${collectionId}/items`, { itemId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Added to collection!")
      setShowColMenu(false)
    } catch (_) {
      alert("Failed to add to collection.")
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    try {
      const token = await getToken()
      await axios.delete(`http://localhost:5000/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate('/saved')
    } catch (_) {
      alert("Failed to delete.")
    }
  }

  if (loading) return <div className="p-6 text-gray-400 animate-pulse">Loading memory vault...</div>
  if (error || !item) return <div className="p-6 text-red-500">{error || 'Item not found'}</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={20} className="mr-2" /> Back
      </button>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            {item.favicon && <img src={item.favicon} alt="favicon" className="w-8 h-8 rounded" />}
            <span className="px-3 py-1 bg-white/10 text-xs uppercase tracking-wider rounded-md text-gray-300">
              {item.type}
            </span>
            <span className={`px-3 py-1 text-xs rounded-md uppercase ${item.aiStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' : item.aiStatus === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500 animate-pulse'}`}>
              AI: {item.aiStatus}
            </span>
          </div>
          <div className="flex space-x-3">
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors">
                <ExternalLink size={20} />
              </a>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setShowColMenu(!showColMenu)}
                title="Add to Collection"
                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
              >
                <FolderPlus size={20} />
              </button>
              {showColMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                   {collections.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No collections yet</div>
                   ) : collections.map(c => (
                      <button 
                        key={c._id} 
                        onClick={() => handleAddToCollection(c._id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-500/20 hover:text-white transition-colors truncate"
                      >
                        {c.name}
                      </button>
                   ))}
                </div>
              )}
            </div>

            <button onClick={handleDelete} title="Delete memory" className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 leading-tight">{item.title}</h1>
        
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors text-sm break-all mb-8 inline-block">
            {item.url}
          </a>
        )}

        {item.summary && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-white/80">AI Summary</h3>
            <p className="text-gray-300 leading-relaxed text-lg">{item.summary}</p>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mb-8 border-t border-white/5 pt-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider flex items-center">
              <Tag size={16} className="mr-2" /> Detected Concepts
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.content && (
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Raw Extracted Content</h3>
            <div className="bg-black/50 p-4 rounded-xl max-h-96 overflow-y-auto font-mono text-sm text-gray-400 whitespace-pre-wrap">
              {item.content}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
