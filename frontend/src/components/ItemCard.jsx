import React from 'react';
import { ExternalLink, Tag, MessageSquare, Clock } from 'lucide-react';

const ItemCard = ({ item }) => {
  const isProcessing = item.status === 'processing';

  return (
    <div className="glass rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group">
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
            isProcessing ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
          }`}>
            {item.status}
          </span>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
          {item.title}
        </h3>

        <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
          {item.summary || item.content}
        </p>

        <div className="mt-auto pt-4 flex flex-wrap gap-2 border-t border-white/5">
          {item.tags?.map((tag) => (
            <span key={tag} className="text-[11px] bg-white/5 text-gray-300 px-2 py-1 rounded-lg border border-white/5">
              #{tag}
            </span>
          ))}
          {!item.tags?.length && !isProcessing && (
            <span className="text-[11px] text-gray-600 italic">No tags</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
