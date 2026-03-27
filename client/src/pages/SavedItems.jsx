import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import ItemCard from '../components/ItemCard'

export default function SavedItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = await getToken()
        const res = await axios.get('http://localhost:5000/api/items/search', {
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
  }, [getToken])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Saved Items</h1>
      
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
