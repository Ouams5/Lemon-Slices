import React from 'react';
import { Slide, SlideComponent } from '../types';

interface SlideCanvasProps {
  slide: Slide;
}

const ComponentRenderer: React.FC<{ component: SlideComponent }> = ({ component }) => {
  switch (component.type) {
    case 'text':
      return (
        <div 
          className="relative group p-4 border border-transparent hover:border-cyan hover:border-dashed transition-all"
          style={component.style}
        >
          {component.content}
          {component.tool_tags && component.tool_tags.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-obsidian border border-cyan px-2 py-0.5 text-[10px] text-cyan opacity-0 group-hover:opacity-100">
              {component.tool_tags.join(', ')}
            </div>
          )}
        </div>
      );
    case 'image':
      return (
        <div className="relative group w-full h-full overflow-hidden border-2 border-transparent hover:border-cyan">
           <img 
             src={component.src || component.content || `https://picsum.photos/seed/${component.id}/800/600`} 
             alt={component.image_prompt}
             className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
           />
           <div className="absolute bottom-0 left-0 bg-obsidian/80 text-cyan text-xs p-2 opacity-0 group-hover:opacity-100 w-full truncate">
             Aether-Paint: {component.image_prompt}
           </div>
        </div>
      );
    case 'chart':
      return (
        <div className="w-full h-full border border-cyan/30 bg-white/5 p-4 flex items-center justify-center relative">
          <div className="text-cyan font-display text-xl animate-pulse">
            [3D Data Visualization]
          </div>
          <p className="absolute bottom-2 text-xs text-softwhite/50 font-mono">{component.content}</p>
        </div>
      );
    case 'poll':
      return (
        <div className="w-full p-6 border-2 border-cyan bg-obsidian shadow-neon">
          <h3 className="text-xl font-display text-cyan mb-4">LIVE POLL</h3>
          <p className="text-lg mb-4">{component.content}</p>
          <div className="flex gap-2">
            <button className="flex-1 border border-softwhite py-2 hover:bg-softwhite hover:text-obsidian transition-colors">Yes</button>
            <button className="flex-1 border border-softwhite py-2 hover:bg-softwhite hover:text-obsidian transition-colors">No</button>
          </div>
        </div>
      );
    case 'icon':
        return (
            <div className="flex items-center justify-center p-4 border border-dashed border-cyan/50 rounded-full w-24 h-24 mx-auto">
                 <span className="text-4xl">🤖</span>
            </div>
        )
    default:
      return null;
  }
};

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-obsidian overflow-hidden relative">
      {/* Background Grid for aesthetic */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      <div className="aspect-video w-full max-w-5xl bg-neutral-900 border border-gray-800 shadow-2xl relative p-12 flex flex-col gap-6" id="canvas-export">
        {/* Slide Title */}
        <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase tracking-tighter mb-4">
            {slide.title}
        </h1>
        
        {/* Components Layout - Simple grid for demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {slide.components.map((comp) => (
                <div key={comp.id} className="flex flex-col justify-center">
                    <ComponentRenderer component={comp} />
                </div>
            ))}
        </div>

        {/* Slide Number */}
        <div className="absolute bottom-4 right-6 font-mono text-cyan/50 text-xl">
            0{slide.slide_number}
        </div>
      </div>
    </div>
  );
};
