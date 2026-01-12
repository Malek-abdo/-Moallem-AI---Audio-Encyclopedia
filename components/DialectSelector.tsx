import React, { useState } from 'react';
import { DialectOption } from '../types';
import { DIALECTS } from '../constants';
import { Check, Globe, MapPin } from 'lucide-react';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const DialectSelector: React.FC<Props> = ({ selectedId, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'arab' | 'world'>('arab');

  const filteredDialects = DIALECTS.filter(d => d.category === activeTab);

  return (
    <div>
      {/* iOS Segmented Control */}
      <div className="flex p-1 bg-gray-100 dark:bg-black/30 rounded-xl mb-4 relative">
        <button
          onClick={() => setActiveTab('arab')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all z-10
            ${activeTab === 'arab' 
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
          `}
        >
          <MapPin size={16} />
          <span>الدول العربية</span>
        </button>
        <button
          onClick={() => setActiveTab('world')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all z-10
            ${activeTab === 'world' 
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
          `}
        >
          <Globe size={16} />
          <span>لغات العالم</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {filteredDialects.map((dialect) => {
          const isSelected = selectedId === dialect.id;
          return (
            <button
              key={dialect.id}
              onClick={() => onSelect(dialect.id)}
              className={`
                relative flex items-center p-3 rounded-xl border transition-all duration-200 text-right group
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500 z-10' 
                  : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'}
              `}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl bg-white dark:bg-white/10 rounded-full ml-3 shadow-sm">
                {dialect.emoji}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-primary-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {dialect.name}
                </h3>
                <p className={`text-xs truncate ${isSelected ? 'text-primary-700 dark:text-gray-300' : 'text-gray-500'}`}>
                  {dialect.description}
                </p>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 text-primary-500 ml-1">
                  <Check size={18} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DialectSelector;