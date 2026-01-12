import React from 'react';
import { VoiceName } from '../types';
import { VOICES } from '../constants';

interface Props {
  selectedVoice: VoiceName;
  onSelect: (voice: VoiceName) => void;
}

const GenderSelector: React.FC<Props> = ({ selectedVoice, onSelect }) => {
  return (
    <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
      <div className="flex gap-3 min-w-max">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          return (
            <button
              key={voice.id}
              onClick={() => onSelect(voice.id)}
              className={`
                group relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 w-28
                ${isSelected 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg transform scale-105' 
                  : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}
              `}
            >
              <div className="text-3xl mb-3">
                {voice.emoji}
              </div>
              
              <div className="font-bold text-sm mb-1">
                {voice.label}
              </div>
              
              <div className={`text-[10px] text-center leading-tight opacity-70`}>
                {voice.description.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenderSelector;