import React, { useEffect, useState, useRef } from 'react';
// import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph2D from "react-force-graph-2d";
import { fetchGraphData } from '../services/api';
import { Network, Loader2 } from 'lucide-react';

const GraphView = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const loadData = async () => {
    try {
      const { data } = await fetchGraphData();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to load graph data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Network className="text-indigo-400" />
            Knowledge Graph
          </h1>
          <p className="text-gray-500 text-sm mt-1">Connections discovered through shared tags and meaning.</p>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 glass rounded-3xl overflow-hidden relative border border-white/5 bg-black/20">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel="id"
            nodeColor={() => '#6366f1'}
            linkColor={() => '#ffffff10'}
            nodeRelSize={6}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            backgroundColor="rgba(0,0,0,0)"
            onNodeClick={(node) => console.log('Node clicked:', node)}
          />
        )}
      </div>
    </div>
  );
};

export default GraphView;
