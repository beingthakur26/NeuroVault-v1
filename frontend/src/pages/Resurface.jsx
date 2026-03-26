import React, { useState, useEffect } from 'react';
import { resurfaceItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import { Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const Resurface = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadResurface = async () => {
    try {
      setLoading(true);
      const { data } = await resurfaceItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to resurface items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResurface();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-indigo-500/10 p-8 rounded-3xl border border-indigo-500/20">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Daily Resurface</h1>
            <p className="text-gray-400 mt-1 max-w-md">Rediscover forgotten gems from your past saves. Keeping your knowledge living and accessible.</p>
          </div>
        </div>
        <button 
          onClick={loadResurface}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl transition-all border border-white/10 active:scale-95"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass h-80 rounded-3xl animate-pulse" />
          ))
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ItemCard item={item} />
            </motion.div>
          ))
        )}
      </div>

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-gray-500 italic">
          No items to resurface yet. Try saving more content!
        </div>
      )}
    </div>
  );
};

export default Resurface;
