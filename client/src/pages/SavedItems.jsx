import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { useSearchParams } from 'react-router-dom'
import { XCircle, Folder } from 'lucide-react'
import ItemCard from '../components/ItemCard'

export default function SavedItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getToken } = useAuth()
  
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const collectionId = searchParams.get('collection') || ''
  const collectionName = searchParams.get('name') || ''

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        const token = await getToken()
        
        let endpoint = `${import.meta.env.VITE_API_URL}/api/items/search?`
        if (query) endpoint += `query=${encodeURIComponent(query)}&`
        if (collectionId) endpoint += `collection=${encodeURIComponent(collectionId)}&`
          
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setItems(res.data.items)
        setError(null)
      } catch (err) {
        console.error(err)
        setError("Failed to fetch items.")
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [getToken, query, collectionId])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          {collectionName && <Folder className="text-blue-400" size={24} />}
          {collectionName && !query ? `${collectionName} Collection` : query ? `Search Results for "${query}"` : "Saved Items"}
        </h1>
        {(query || collectionId) && (
          <button 
            onClick={() => setSearchParams({})} 
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 py-1.5 px-3 rounded-lg border border-white/10"
          >
            <XCircle size={16} /> <span>Clear Filters</span>
          </button>
        )}
      </div>
      
      {loading && <div className="text-gray-500 animate-pulse mt-8">Loading your knowledge base...</div>}
      {error && <div className="text-red-500 mt-8">{error}</div>}
      
      {!loading && !error && items.length === 0 && (
        <div className="text-gray-500 mt-8">Your brain is empty. Save something from the Dashboard!</div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
