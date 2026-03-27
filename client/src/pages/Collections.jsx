import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import ItemCard from '../components/ItemCard'
import { Folder, Plus, Loader2 } from 'lucide-react'

export default function Collections() {
  const [clusters, setClusters] = useState([])
  const [collections, setCollections] = useState([])
  const [newCollectionName, setNewCollectionName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const { getToken } = useAuth()

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const [clusterRes, colRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items/clusters', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/collections', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setClusters(clusterRes.data.clusters)
      setCollections(colRes.data.collections)
      setError(null)
    } catch (_) {
      setError("Failed to load collections.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken])

  const handleCreateCollection = async (e) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return
    setIsCreating(true)
    try {
      const token = await getToken()
      await axios.post('http://localhost:5000/api/collections', { name: newCollectionName }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNewCollectionName('')
      await fetchData()
    } catch (_) {
      alert("Failed to create collection")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Collections</h1>
      
      {loading && <div className="text-gray-500 animate-pulse">Organizing collections...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {/* Manual Collections Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-white/80 border-b border-white/10 pb-2">Your Collections</h2>
        
        <form onSubmit={handleCreateCollection} className="mb-6 flex space-x-3">
          <input 
            type="text" 
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New Collection Name..." 
            className="bg-[#111] border border-white/10 px-4 py-2 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={isCreating || !newCollectionName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>Create</span>
          </button>
        </form>

        {collections.length === 0 ? (
          <p className="text-gray-500 text-sm">No manual collections created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((col) => (
              <div key={col._id} className="p-6 bg-[#111] rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer group">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <Folder size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white">{col.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4 text-white/80 border-b border-white/10 pb-2">AI Topic Clusters</h2>
      {!loading && !error && clusters.length === 0 && (
        <p className="text-gray-400">Save more items to let the AI organize your collections.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {clusters.map((cluster, idx) => (
          <div key={idx} className="p-6 bg-[#111] rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Folder size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white capitalize">{cluster._id}</h3>
                <p className="text-sm text-gray-400">{cluster.count} Items</p>
              </div>
            </div>
            <ul className="space-y-2 mt-4">
              {cluster.items.slice(0, 3).map(item => (
                <li key={item._id} className="text-sm text-gray-300 truncate">
                  • {item.title}
                </li>
              ))}
              {cluster.items.length > 3 && (
                <li className="text-xs text-gray-500 italic">+{cluster.items.length - 3} more</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
