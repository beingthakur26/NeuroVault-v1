import React, { useState, useEffect } from 'react';
import { fetchItems, createItem, searchItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import { Plus, Search as SearchIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data } = await fetchItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      try {
        const { data } = await searchItems(query);
        setItems(data);
      } catch (error) {
        console.error('Search failed', error);
      }
    } else if (query.trim() === '') {
      loadItems();
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    try {
      const { data } = await createItem({ url: newUrl });
      setItems([data, ...items]);
      setNewUrl('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Brain</h1>
          <p className="text-gray-500 text-sm mt-1">Collecting and organizing your digital insights.</p>
        </div>
        <div className="relative group w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search your brain..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 active:scale-90"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="glass h-64 rounded-2xl animate-pulse" />
          ))
        ) : (
          items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))
        )}
      </div>

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-medium text-white">No items yet</h2>
          <p className="text-gray-500 mt-1 max-w-xs">Start by saving your first URL or note to your second brain.</p>
        </div>
      )}

      {/* Modal for adding new URL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass w-full max-w-md rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">New Insight</h2>
            <form onSubmit={handleAdd}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">URL to save</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com"
                    autoFocus
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Ingest Content
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
