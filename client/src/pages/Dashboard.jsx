import { useState, useEffect } from 'react'
import SaveContent from '../components/SaveContent'
import RecentItems from '../components/RecentItems'
import { Download, Sparkles, BrainCircuit, RotateCw } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0)
  const [clusters, setClusters] = useState([])
  const [resurfaced, setResurfaced] = useState([])
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      try {
        const token = await getToken()
        
        const [clustersRes, resurfaceRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/items/clusters`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/items/resurface`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        setClusters(clustersRes.data.clusters)
        setResurfaced(resurfaceRes.data.items)
      } catch (err) {
        console.error("Dashboard Analytics Error", err)
      }
    }
    fetchDashboardAnalytics()
  }, [getToken, refresh])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setRefresh(r => r + 1)}
            className="flex items-center space-x-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <a 
            href="/extension-build.zip" 
            download 
            className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
          >
            <Download size={16} />
            <span>Get Extension</span>
          </a>
        </div>
      </div>
      
      <SaveContent onSaved={() => setRefresh(r => r + 1)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Hub Stats */}
        <div className="p-6 bg-[#111] rounded-2xl border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <BrainCircuit size={18} className="text-indigo-400" />
              <h2 className="text-lg text-white">Knowledge Hub</h2>
            </div>
            <p className="text-sm text-gray-400">Your central command center for all saved data.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <span className="text-xs text-gray-500 block">Total Capacity: Active</span>
          </div>
        </div>

        {/* Resurfaced Items */}
        <div className="p-6 bg-[#111] rounded-2xl border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <RotateCw size={18} className="text-blue-400" />
                <h2 className="text-lg text-white">Resurfaced</h2>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2">Forgotten items you might find useful today.</p>
            {resurfaced.length > 0 ? (
              <ul className="space-y-2 mt-2">
                {resurfaced.map(item => (
                  <li key={item._id} className="text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg truncate">
                    {item.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-600 mt-2">No past memories yet.</p>
            )}
          </div>
        </div>

        {/* Topic Clusters */}
        <div className="p-6 bg-[#111] rounded-2xl border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="text-lg text-white">Top Clusters</h2>
            </div>
            <p className="text-sm text-gray-400 mb-2">AI-suggested related topics and domains.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {clusters.map((cluster, i) => (
                <span key={i} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded-full cursor-pointer hover:bg-amber-500/20 transition-colors">
                  #{cluster._id} <span className="text-amber-500 ml-1">{cluster.count}</span>
                </span>
              ))}
              {clusters.length === 0 && <p className="text-xs text-gray-600">No clusters formed yet.</p>}
            </div>
          </div>
        </div>

      </div>

      <RecentItems triggerRefresh={refresh} />
    </div>
  )
}
