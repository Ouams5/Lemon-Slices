import React from 'react';
import { MANUAL_TOOLS } from '../constants';
import * as LucideIcons from 'lucide-react';
import { Blocks } from 'lucide-react';
import { PluginDefinition } from '../types';

interface ToolbarProps {
  onAddComponent: (type: string) => void;
  onOpenExtensions: () => void;
  plugins?: PluginDefinition[];
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddComponent, onOpenExtensions, plugins }) => {
  return (
    <div className="
        md:w-20 md:h-full md:border-r-2 md:border-t-0 md:flex-col
        w-full h-16 border-t-2 border-obsidian flex-row fixed bottom-0 left-0 bg-white z-50
        flex items-center justify-center md:justify-start md:py-6 gap-2 md:gap-6 shrink-0
    ">
      {/* Logo only on Desktop Sidebar */}
      <div className="hidden md:block mb-4">
        <div className="w-10 h-10 bg-lemon border-2 border-obsidian rounded-none flex items-center justify-center shadow-hard cursor-default">
            <span className="text-obsidian font-bold text-xl">L</span>
        </div>
      </div>
      
      {/* Tool Icons */}
      <div className="flex md:flex-col flex-row gap-4 px-4 w-full justify-around md:justify-start overflow-x-auto md:overflow-visible">
        {/* Standard Tools */}
        {MANUAL_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
                <button
                    key={tool.id}
                    onClick={() => onAddComponent(tool.id.replace('add-', ''))}
                    className="group relative flex items-center justify-center p-2 md:w-full md:aspect-square border-2 border-transparent hover:border-obsidian hover:bg-lemon/20 active:bg-lemon transition-all rounded-md shrink-0"
                    aria-label={tool.label}
                >
                    <Icon className="text-obsidian group-hover:scale-110 transition-transform" size={24} />
                    
                    {/* Desktop Tooltip */}
                    <div className="absolute left-full ml-4 bg-obsidian text-white border-2 border-lemon px-3 py-2 w-32 hidden md:group-hover:block z-50 shadow-hard pointer-events-none">
                        <p className="font-display font-bold text-lemon text-sm mb-1">{tool.label}</p>
                    </div>
                </button>
            )
        })}

        <div className="w-px h-8 md:w-8 md:h-px bg-gray-300 shrink-0"></div>

        {/* Single Extensions Button */}
        <button
            onClick={onOpenExtensions}
            className="group relative flex items-center justify-center p-2 md:w-full md:aspect-square border-2 border-dashed border-gray-400 hover:border-lemon hover:bg-lemon/10 active:bg-lemon transition-all rounded-md shrink-0"
            aria-label="Extensions"
        >
            <Blocks className="text-obsidian group-hover:scale-110 transition-transform" size={24} />
            
            {/* Desktop Tooltip */}
            <div className="absolute left-full ml-4 bg-white text-obsidian border-2 border-obsidian px-3 py-2 w-32 hidden md:group-hover:block z-50 shadow-hard pointer-events-none">
                <p className="font-display font-bold text-xs mb-1 uppercase bg-lemon inline-block px-1">EXTENSIONS</p>
                <p className="text-[10px] text-gray-500">Browse & Run</p>
                {plugins && plugins.length > 0 && <p className="text-[8px] mt-1 text-green-600 font-bold">{plugins.length} Installed</p>}
            </div>
        </button>
      </div>
    </div>
  );
};