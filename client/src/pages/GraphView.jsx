import { useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'

export default function GraphView() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const fgRef = useRef()
  const { getToken } = useAuth()

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const token = await getToken()
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/items/graph`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setGraphData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGraph()
  }, [getToken])

  const handleNodeClick = useCallback(node => {
    fgRef.current?.centerAt(node.x, node.y, 1000);
    fgRef.current?.zoom(8, 2000);
  }, [fgRef]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-gray-400">
        <div className="animate-pulse">Mapping your neural network...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Knowledge Graph</h1>
        <p className="text-sm text-gray-500">Connections are formed by shared AI tags across items.</p>
      </div>

      <div className="flex-1 bg-black rounded-3xl overflow-hidden border border-white/5 relative shadow-inner">
        {graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            No connections found yet.
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={node => {
              if (node.group === 1) return '#ef4444' // Video
              if (node.group === 2) return '#3b82f6' // PDF
              return '#10b981' // Article/Other
            }}
            nodeRelSize={6}
            linkColor={() => 'rgba(255, 255, 255, 0.2)'}
            linkWidth={link => link.value * 1.5}
            onNodeClick={handleNodeClick}
            backgroundColor="#000000"
            // Layout physics configuration
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.2}
          />
        )}
        
        <div className="absolute bottom-4 left-4 bg-[#111] p-3 rounded-lg border border-white/10 text-xs">
          <div className="flex items-center space-x-2 mb-1"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Video</span></div>
          <div className="flex items-center space-x-2 mb-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span>PDF</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span>Article</span></div>
        </div>
      </div>
    </div>
  )
}
