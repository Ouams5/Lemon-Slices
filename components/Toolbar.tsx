import React from 'react';
import { TOOLS } from '../constants';
import { ToolName } from '../types';

interface ToolbarProps {
  onSelectTool: (toolId: ToolName) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSelectTool }) => {
  return (
    <div className="w-20 bg-obsidian border-r border-gray-800 flex flex-col items-center py-6 gap-6 z-20 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-4">
        <div className="w-10 h-10 bg-cyan rounded-none rotate-45 flex items-center justify-center shadow-neon">
            <span className="text-obsidian font-bold -rotate-45 text-xl">L</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 w-full px-2">
        {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
                <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className="group relative flex items-center justify-center w-full aspect-square border border-gray-800 hover:border-cyan hover:bg-cyan/10 transition-all rounded-md"
                    aria-label={tool.label}
                >
                    <Icon className="text-softwhite group-hover:text-cyan group-hover:scale-110 transition-transform" size={20} />
                    
                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 bg-obsidian border border-cyan px-3 py-2 w-48 hidden group-hover:block z-50 shadow-neon">
                        <p className="font-display font-bold text-cyan text-sm mb-1">{tool.label}</p>
                        <p className="font-sans text-xs text-gray-400">{tool.description}</p>
                    </div>
                </button>
            )
        })}
      </div>
    </div>
  );
};