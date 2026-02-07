import React, { useRef, useState, useEffect } from 'react';
import { Slide, SlideComponent, ChartDataPoint, PollOption, AnimationConfig } from '../types';
import { Trash2, GripHorizontal, Plus, X, BarChart3, Vote, Image as ImageIcon, Box } from 'lucide-react';
import { Button } from '../Button';
import { DraggableWindow } from './DraggableWindow';

interface SlideCanvasProps {
  slide: Slide;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onMultiSelect: (ids: string[]) => void;
  onUpdateComponent: (id: string, updates: Partial<SlideComponent>) => void;
  onDeleteComponent: (id: string) => void;
  onUpdateMultiple: (updates: Partial<SlideComponent>) => void;
  previewTrigger?: number;
  readOnly?: boolean; // New prop for Present Mode
}

// Markdown Display
const MarkdownRenderer: React.FC<{ content: string; font: string; textColor: string; isGradient?: boolean }> = ({ content, font, textColor, isGradient }) => {
    const fontClass = {
        'sans': 'font-sans',
        'serif': 'font-serif',
        'mono': 'font-mono',
        'display': 'font-display'
    }[font] || 'font-sans';

    const style = isGradient ? {
        backgroundImage: 'linear-gradient(45deg, #DFFF00, #FF00FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block'
    } : { color: textColor };

    // Robust parsing
    const renderContent = () => {
        return content.split('\n').map((line, idx) => {
            // Headers
            if (line.startsWith('### ')) return <h3 key={idx} className="mb-1 font-bold text-lg" style={style}>{line.replace('### ', '')}</h3>;
            if (line.startsWith('## ')) return <h2 key={idx} className="mb-2 font-bold text-2xl" style={{...style, borderBottom: `2px solid ${textColor === '#ffffff' ? '#DFFF00' : '#000'}`}}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('# ')) return <h1 key={idx} className="mb-4 font-extrabold text-4xl uppercase leading-tight" style={style}>{line.replace('# ', '')}</h1>;
            
            // Lists
            if (line.startsWith('* ') || line.startsWith('- ')) return <li key={idx} className="ml-6 mb-1 list-square pl-1" style={{ color: textColor }}>{line.replace(/^[\*\-] /, '')}</li>;
            if (line.match(/^\d+\. /)) return <li key={idx} className="ml-6 mb-1 list-decimal pl-1" style={{ color: textColor }}>{line.replace(/^\d+\. /, '')}</li>;

            // Blockquotes
            if (line.startsWith('> ')) return <blockquote key={idx} className="border-l-4 pl-4 italic opacity-80 my-2" style={{ borderColor: textColor, color: textColor }}>{line.replace('> ', '')}</blockquote>;

            // Paragraphs with inline bold
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={idx} className="mb-2 whitespace-pre-wrap leading-relaxed" style={{...style}}>
                    {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-bold opacity-100">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className={`markdown-content w-full h-full ${fontClass} overflow-hidden text-sm md:text-base`}>
            {renderContent()}
        </div>
    );
};

// Chart Visualizer
const ChartVisualizer: React.FC<{ 
    data?: ChartDataPoint[], 
    font: string, 
    textColor: string,
    animation?: AnimationConfig,
    trigger?: number
}> = ({ data, font, textColor, animation, trigger }) => {
    const [progress, setProgress] = useState(1);
    
    useEffect(() => {
        if (!animation) {
            setProgress(1);
            return;
        }

        const isChartAnim = animation.name.startsWith('chart');
        if (!isChartAnim) {
            setProgress(1);
            return;
        }

        setProgress(0);
        let start: number | null = null;
        let reqId: number;
        const duration = (animation.duration || 1) * 1000;

        const loop = (time: number) => {
            if (!start) start = time;
            const elapsed = time - start;
            const p = Math.min(1, elapsed / duration);
            setProgress(p);
            if (p < 1) {
                reqId = requestAnimationFrame(loop);
            }
        };
        reqId = requestAnimationFrame(loop);
        
        return () => cancelAnimationFrame(reqId);
    }, [animation, trigger]);

    if (!data || data.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-400 font-mono text-xs">NO DATA</div>;
    
    const maxVal = Math.max(...data.map(d => d.value));

    const getBarStyle = (index: number, val: number) => {
        if (!animation || progress === 1) return { height: `${(val / maxVal) * 80}%`, opacity: 1, transform: 'none' };
        
        const type = animation.name;
        const baseHeight = (val / maxVal) * 80;

        if (type === 'chartGrowUp') return { height: `${baseHeight * progress}%`, opacity: 1 };
        
        if (type === 'chartElastic') {
             const backOut = (t: number) => { const s = 1.70158; return --t * t * ((s + 1) * t + s) + 1; };
             return { height: `${baseHeight * backOut(progress)}%`, opacity: 1 };
        }

        if (type === 'chartStagger') {
            const delay = index * 0.1;
            const localProgress = Math.max(0, Math.min(1, (progress - delay) * 2)); 
            return { height: `${baseHeight}%`, opacity: localProgress, transform: `translateY(${20 * (1-localProgress)}px)` };
        }
        
        if (type === 'chartWave') {
             const delay = index * 0.15;
             const localP = Math.max(0, Math.min(1, (progress - delay) * 1.5));
             return { height: `${baseHeight * localP}%`, opacity: 1 };
        }
        
        if (type === 'chartDrop') {
             const easeOutBounce = (x: number): number => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (x < 1 / d1) { return n1 * x * x; } else if (x < 2 / d1) { return n1 * (x -= 1.5 / d1) * x + 0.75; } else if (x < 2.5 / d1) { return n1 * (x -= 2.25 / d1) * x + 0.9375; } else { return n1 * (x -= 2.625 / d1) * x + 0.984375; }
             };
             return { height: `${baseHeight}%`, transformOrigin: 'bottom', transform: `translateY(${-200 * (1-easeOutBounce(progress))}%)`, opacity: progress > 0.1 ? 1 : 0 };
        }

        if (type === 'chartCenter') {
             return { height: `${baseHeight}%`, transform: `scaleY(${progress})`, transformOrigin: 'center', opacity: 1 };
        }

        if (type === 'chartWipe') {
             const screenP = index / data.length;
             const isVisible = progress > screenP;
             return { height: `${baseHeight}%`, opacity: isVisible ? 1 : 0, transition: 'opacity 0.2s' };
        }

        if (type === 'chartPop') {
             return { height: `${baseHeight}%`, transform: `scale(${progress})`, transformOrigin: 'bottom center', opacity: progress };
        }

        return { height: `${baseHeight}%`, opacity: 1 };
    };

    const getDisplayValue = (val: number) => {
        if (!animation || progress === 1) return val;
        if (animation.name === 'chartGrowUp' || animation.name === 'chartElastic') {
            return Math.floor(val * progress);
        }
        return val;
    };

    return (
        <div className="w-full h-full p-4 flex flex-col justify-end">
             <div className="flex items-end justify-around h-full gap-2">
                 {data.map((d, i) => {
                     const style = getBarStyle(i, d.value);
                     return (
                         <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                             <div className="text-[10px] font-bold mb-1 transition-opacity" style={{ color: textColor, opacity: progress === 1 ? 0 : 1, groupHoverOpacity: 1 }}>
                                 {getDisplayValue(d.value)}
                             </div>
                             <div 
                                className="w-full bg-lemon border border-obsidian hover:bg-lemon/80 relative origin-bottom"
                                style={{ 
                                    backgroundColor: d.color || '#DFFF00',
                                    ...style
                                }}
                             ></div>
                             <div className={`text-[10px] mt-2 truncate max-w-full text-center font-${font}`} style={{ color: textColor, opacity: style.opacity }}>{d.label}</div>
                         </div>
                     );
                 })}
             </div>
        </div>
    );
};

// Poll Visualizer
const PollVisualizer: React.FC<{ question?: string, options?: PollOption[], font: string, textColor: string }> = ({ question, options, font, textColor }) => {
    const totalVotes = options?.reduce((acc, curr) => acc + curr.votes, 0) || 1;
    
    return (
        <div className="w-full h-full p-4 flex flex-col justify-center">
            <h3 className={`font-${font} font-bold text-lg mb-4`} style={{ color: textColor }}>{question || 'Poll Question'}</h3>
            <div className="flex flex-col gap-3">
                {options?.map(opt => {
                    const pct = Math.round((opt.votes / totalVotes) * 100);
                    return (
                        <div key={opt.id} className="relative h-8 bg-gray-100 border border-obsidian">
                            <div className="absolute top-0 left-0 h-full bg-lemon" style={{ width: `${pct}%` }}></div>
                            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-bold font-mono" style={{ color: '#000' }}>
                                <span>{opt.text}</span>
                                <span>{pct}%</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// --- Main Canvas Component ---

export const SlideCanvas: React.FC<SlideCanvasProps> = ({ 
  slide, 
  selectedIds, 
  onSelect, 
  onMultiSelect,
  onUpdateComponent,
  onDeleteComponent,
  onUpdateMultiple,
  previewTrigger = 0,
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [playAnimations, setPlayAnimations] = useState(false);
  
  // Dragging State for Multi-Selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialPositions, setInitialPositions] = useState<Record<string, { top: number, left: number }>>({});
  
  // Resizing State
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialResizeState, setInitialResizeState] = useState<{ x: number, y: number, w: number, h: number, l: number, t: number } | null>(null);

  // Editing States
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          // Adjust scale calculation based on readOnly (Present Mode might need different logic)
          const availableWidth = parent.clientWidth - (readOnly ? 0 : 40); 
          const baseWidth = 1000; 
          const newScale = Math.min(1, availableWidth / baseWidth);
          setScale(newScale);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, [readOnly]);
  
  useEffect(() => {
      if(previewTrigger > 0 || readOnly) {
          setPlayAnimations(false);
          const t = setTimeout(() => setPlayAnimations(true), 50);
          return () => clearTimeout(t);
      }
  }, [previewTrigger, readOnly]);

  const parsePos = (comp: SlideComponent) => {
      const parentW = 1000;
      const parentH = 562.5;
      let left = 0;
      let top = 0;
      const styleLeft = comp.style?.left || '0';
      const styleTop = comp.style?.top || '0';

      if (typeof styleLeft === 'string' && styleLeft.endsWith('%')) {
          left = (parseFloat(styleLeft) / 100) * parentW;
      } else {
          left = parseFloat(styleLeft as string) || 0;
      }

      if (typeof styleTop === 'string' && styleTop.endsWith('%')) {
          top = (parseFloat(styleTop) / 100) * parentH;
      } else {
          top = parseFloat(styleTop as string) || 0;
      }
      return { left, top };
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (readOnly || editingId === id || resizingId === id) return;
    
    const isShift = (e as React.MouseEvent).shiftKey;
    const clickedComp = slide.components.find(c => c.id === id);
    let idsToSelect = [id];
    if (clickedComp?.groupId) {
        idsToSelect = slide.components.filter(c => c.groupId === clickedComp.groupId).map(c => c.id);
    }

    if (isShift) {
        const newSelection = selectedIds.includes(id) 
            ? selectedIds.filter(sid => !idsToSelect.includes(sid))
            : [...selectedIds, ...idsToSelect];
        onMultiSelect(newSelection);
        if (!selectedIds.includes(id)) return; 
    } else {
        if (!selectedIds.includes(id)) {
            onMultiSelect(idsToSelect);
        }
    }

    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStartPos({ x: clientX, y: clientY });
    setIsDragging(true);

    const initials: Record<string, { top: number, left: number }> = {};
    const activeIds = (!isShift && !selectedIds.includes(id)) ? idsToSelect : selectedIds;

    activeIds.forEach(sid => {
        const comp = slide.components.find(c => c.id === sid);
        if (comp) initials[sid] = parsePos(comp);
    });
    setInitialPositions(initials);
  };

  const [currentDragDelta, setCurrentDragDelta] = useState({ x: 0, y: 0 });

  const onDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      setCurrentDragDelta({
          x: (clientX - dragStartPos.x) / scale,
          y: (clientY - dragStartPos.y) / scale
      });
  };

  const onDragEnd = () => {
      if (isDragging) {
          Object.keys(initialPositions).forEach(id => {
              const init = initialPositions[id];
              const newLeft = init.left + currentDragDelta.x;
              const newTop = init.top + currentDragDelta.y;
              const pctLeft = (newLeft / 1000) * 100;
              const pctTop = (newTop / 562.5) * 100;

              onUpdateComponent(id, {
                  style: {
                      ...slide.components.find(c => c.id === id)?.style,
                      left: `${pctLeft.toFixed(2)}%`,
                      top: `${pctTop.toFixed(2)}%`
                  }
              });
          });
      }
      setIsDragging(false);
      setCurrentDragDelta({ x: 0, y: 0 });
      setInitialPositions({});
  };

  const handleResizeStart = (e: React.MouseEvent, id: string, handle: string) => {
      if(readOnly) return;
      e.stopPropagation();
      e.preventDefault();
      setResizingId(id);
      setResizeHandle(handle);
      
      const comp = slide.components.find(c => c.id === id);
      const el = (e.target as HTMLElement).closest('.slide-component') as HTMLElement;
      if (comp && el) {
          const rect = el.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
              setInitialResizeState({
                  x: e.clientX,
                  y: e.clientY,
                  w: rect.width / scale,
                  h: rect.height / scale,
                  l: (rect.left - containerRect.left) / scale,
                  t: (rect.top - containerRect.top) / scale
              });
          }
      }
  };

  const handleResizeMove = (e: MouseEvent) => {
      if (!resizingId || !initialResizeState || !resizeHandle) return;
      const dx = (e.clientX - initialResizeState.x) / scale;
      const dy = (e.clientY - initialResizeState.y) / scale;
      let newW = initialResizeState.w;
      let newH = initialResizeState.h;
      let newL = initialResizeState.l;
      let newT = initialResizeState.t;

      if (resizeHandle.includes('e')) newW = initialResizeState.w + dx;
      if (resizeHandle.includes('w')) { newW = initialResizeState.w - dx; newL = initialResizeState.l + dx; }
      if (resizeHandle.includes('s')) newH = initialResizeState.h + dy;
      if (resizeHandle.includes('n')) { newH = initialResizeState.h - dy; newT = initialResizeState.t + dy; }

      if (newW < 20) newW = 20;
      if (newH < 20) newH = 20;

      const comp = slide.components.find(c => c.id === resizingId);
      if (comp) {
           onUpdateComponent(resizingId, {
              style: {
                  ...comp.style,
                  width: `${newW}px`,
                  height: `${newH}px`,
                  left: `${(newL / 1000) * 100}%`,
                  top: `${(newT / 562.5) * 100}%`
              }
           });
      }
  };

  const handleResizeEnd = () => {
      setResizingId(null);
      setResizeHandle(null);
      setInitialResizeState(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchmove', onDragMove, { passive: false });
      window.addEventListener('touchend', onDragEnd);
      return () => {
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);
      };
    }
  }, [isDragging, currentDragDelta]);

  useEffect(() => {
      if (resizingId) {
          window.addEventListener('mousemove', handleResizeMove);
          window.addEventListener('mouseup', handleResizeEnd);
          return () => {
              window.removeEventListener('mousemove', handleResizeMove);
              window.removeEventListener('mouseup', handleResizeEnd);
          }
      }
  }, [resizingId, resizeHandle, initialResizeState]);


  const handleDoubleClick = (id: string) => {
      if (readOnly) return;
      const comp = slide.components.find(c => c.id === id);
      if (comp?.type === 'custom' && !comp.customType) return;
      setEditingId(id);
  };

  const getRenderStyle = (comp: SlideComponent) => {
    let left = comp.style?.left || '0%';
    let top = comp.style?.top || '0%';
    
    if (isDragging && initialPositions[comp.id]) {
        left = `${initialPositions[comp.id].left + currentDragDelta.x}px`;
        top = `${initialPositions[comp.id].top + currentDragDelta.y}px`;
    }

    const effectsStyle: React.CSSProperties = {};
    if (comp.effects) {
        const { shadow, outline, opacity, blur } = comp.effects;
        if (shadow) {
            effectsStyle.boxShadow = `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.color}`;
        }
        if (outline) {
            effectsStyle.border = `${outline.width}px ${outline.style} ${outline.color}`;
        }
        if (opacity !== undefined) {
            effectsStyle.opacity = opacity;
        }
        if (blur !== undefined) {
            effectsStyle.filter = `blur(${blur}px)`;
        }
    }
    
    const isChartAnim = comp.animation && comp.animation.name.startsWith('chart');
    if (!isChartAnim && comp.animation && (playAnimations || previewTrigger > 0 || readOnly)) {
        effectsStyle.animationName = comp.animation.name;
        effectsStyle.animationDuration = `${comp.animation.duration}s`;
        effectsStyle.animationDelay = `${comp.animation.delay}s`;
        effectsStyle.animationFillMode = 'both'; 
    }

    return { 
        ...comp.style, 
        left, 
        top, 
        position: 'absolute' as const, 
        backgroundColor: comp.backgroundColor || 'transparent',
        ...effectsStyle
    };
  };

  const bgColor = slide.backgroundColor || '#ffffff';
  const isDark = bgColor.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/) ? (parseInt(bgColor.substring(1, 3), 16) * 299 + parseInt(bgColor.substring(3, 5), 16) * 587 + parseInt(bgColor.substring(5, 7), 16) * 114) / 1000 < 128 : false;
  const slideTextColor = isDark ? '#ffffff' : '#000000';
  const animClass = slide.transition && readOnly ? `animate-${slide.transition}` : '';

  return (
    <div 
        className={`w-full h-full flex items-center justify-center overflow-hidden relative touch-none ${readOnly ? 'bg-transparent' : 'bg-paper'}`}
        onClick={() => { if(!readOnly) { onSelect(null); setEditingId(null); } }}
    >
      {!readOnly && (
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
      )}
      
      {editingId && !readOnly && (
          (() => {
              const comp = slide.components.find(c => c.id === editingId);
              if (!comp) return null;

              if (comp.type === 'custom' && comp.customType) {
                   const rawContent = comp.content || '';
                   if (['neo-note', 'neo-badge', 'neo-circle'].includes(comp.customType)) {
                       const matches = rawContent.match(/(<div[^>]*>)(.*)(<\/div>)/);
                       const currentText = matches ? matches[2] : '';
                       const prefix = matches ? matches[1] : '';
                       const suffix = matches ? matches[3] : '';
                       if (!matches) return null;

                       return (
                           <DraggableWindow title={`Edit ${comp.customType.split('-')[1]}`} onClose={() => setEditingId(null)} className="w-64 h-32">
                               <div className="p-4 flex flex-col gap-2">
                                   <label className="text-[10px] font-bold">TEXT CONTENT</label>
                                   <input 
                                       className="border p-2 w-full text-sm font-bold"
                                       autoFocus
                                       value={currentText}
                                       onChange={(e) => {
                                           const newContent = `${prefix}${e.target.value}${suffix}`;
                                           onUpdateComponent(comp.id, { content: newContent });
                                       }}
                                   />
                               </div>
                           </DraggableWindow>
                       );
                   }
                   if (comp.customType === 'neo-card') {
                        const cardMatches = rawContent.match(/(<div[^>]*>)\s*<h3>(.*?)<\/h3>\s*<p>(.*?)<\/p>\s*(<\/div>)/);
                        if (!cardMatches) return null;
                        const prefix = cardMatches[1];
                        const title = cardMatches[2];
                        const body = cardMatches[3];
                        const suffix = cardMatches[4];

                        return (
                           <DraggableWindow title="Edit Card" onClose={() => setEditingId(null)} className="w-72 h-64">
                               <div className="p-4 flex flex-col gap-3">
                                   <div>
                                       <label className="text-[10px] font-bold block mb-1">TITLE</label>
                                       <input 
                                           className="border p-2 w-full text-sm font-bold"
                                           value={title}
                                           onChange={(e) => {
                                               const newContent = `${prefix}<h3>${e.target.value}</h3><p>${body}</p>${suffix}`;
                                               onUpdateComponent(comp.id, { content: newContent });
                                           }}
                                       />
                                   </div>
                                   <div>
                                       <label className="text-[10px] font-bold block mb-1">CONTENT</label>
                                       <textarea 
                                           className="border p-2 w-full text-xs h-24 resize-none"
                                           value={body}
                                           onChange={(e) => {
                                               const newContent = `${prefix}<h3>${title}</h3><p>${e.target.value}</p>${suffix}`;
                                               onUpdateComponent(comp.id, { content: newContent });
                                           }}
                                       />
                                   </div>
                               </div>
                           </DraggableWindow>
                       );
                   }
              }

              if (comp.type === 'chart') {
                  return (
                      <DraggableWindow title="Edit Chart Data" onClose={() => setEditingId(null)} className="w-64 h-80">
                          <div className="p-4 flex flex-col gap-2">
                              {comp.chartData?.map((d, i) => (
                                  <div key={i} className="flex gap-2 items-center">
                                      <input 
                                        className="border p-1 w-20 text-xs font-mono" 
                                        value={d.label} 
                                        onChange={(e) => {
                                            const newData = [...(comp.chartData || [])];
                                            newData[i].label = e.target.value;
                                            onUpdateComponent(comp.id, { chartData: newData });
                                        }}
                                      />
                                      <input 
                                        type="number" 
                                        className="border p-1 w-16 text-xs font-mono" 
                                        value={d.value} 
                                        onChange={(e) => {
                                            const newData = [...(comp.chartData || [])];
                                            newData[i].value = parseInt(e.target.value) || 0;
                                            onUpdateComponent(comp.id, { chartData: newData });
                                        }}
                                      />
                                      <button onClick={() => {
                                           const newData = comp.chartData?.filter((_, idx) => idx !== i);
                                           onUpdateComponent(comp.id, { chartData: newData });
                                      }}><Trash2 size={12} className="text-red-500"/></button>
                                  </div>
                              ))}
                              <Button size="sm" onClick={() => {
                                  const newData = [...(comp.chartData || []), { label: 'New', value: 10 }];
                                  onUpdateComponent(comp.id, { chartData: newData });
                              }} className="mt-2 text-xs py-1"><Plus size={12}/> Add Data</Button>
                          </div>
                      </DraggableWindow>
                  )
              }

              if (comp.type === 'poll') {
                  return (
                      <DraggableWindow title="Edit Poll" onClose={() => setEditingId(null)} className="w-64 h-80">
                          <div className="p-4 flex flex-col gap-2">
                              <label className="text-[10px] font-bold">QUESTION</label>
                              <input 
                                className="border p-1 w-full text-xs" 
                                value={comp.pollQuestion || ''} 
                                onChange={(e) => onUpdateComponent(comp.id, { pollQuestion: e.target.value })}
                              />
                              <label className="text-[10px] font-bold mt-2">OPTIONS</label>
                              {comp.pollOptions?.map((opt, i) => (
                                  <div key={opt.id} className="flex gap-2 items-center">
                                      <input 
                                        className="border p-1 w-full text-xs" 
                                        value={opt.text}
                                        onChange={(e) => {
                                            const newOpts = [...(comp.pollOptions || [])];
                                            newOpts[i].text = e.target.value;
                                            onUpdateComponent(comp.id, { pollOptions: newOpts });
                                        }}
                                      />
                                       <input 
                                        type="number" 
                                        className="border p-1 w-12 text-xs" 
                                        value={opt.votes}
                                        onChange={(e) => {
                                            const newOpts = [...(comp.pollOptions || [])];
                                            newOpts[i].votes = parseInt(e.target.value);
                                            onUpdateComponent(comp.id, { pollOptions: newOpts });
                                        }}
                                      />
                                      <button onClick={() => {
                                            const newOpts = comp.pollOptions?.filter((_, idx) => idx !== i);
                                            onUpdateComponent(comp.id, { pollOptions: newOpts });
                                      }}><Trash2 size={12} className="text-red-500"/></button>
                                  </div>
                              ))}
                              <Button size="sm" onClick={() => {
                                  const newOpts = [...(comp.pollOptions || []), { id: `opt_${Date.now()}`, text: 'Option', votes: 0 }];
                                  onUpdateComponent(comp.id, { pollOptions: newOpts });
                              }} className="mt-2 text-xs py-1"><Plus size={12}/> Add Option</Button>
                          </div>
                      </DraggableWindow>
                  )
              }
              return null;
          })()
      )}

      <div 
        key={slide.id} 
        style={{ 
          width: 1000, 
          height: 562.5, 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: bgColor,
          color: slideTextColor
        }}
        ref={containerRef}
        className={`${!readOnly ? 'border-2 border-obsidian shadow-hard' : ''} relative shrink-0 transition-transform duration-75 ${animClass}`}
      >
        {!readOnly && (
            <div className="absolute bottom-4 right-6 font-display font-bold opacity-10 text-6xl select-none pointer-events-none z-0" style={{ color: slideTextColor }}>
                0{slide.slide_number}
            </div>
        )}

        {slide.components.map((comp) => {
            const isSelected = selectedIds.includes(comp.id);
            const isEditing = editingId === comp.id;
            const style = getRenderStyle(comp);
            const compTextColor = comp.textColor || slideTextColor;

            return (
                <div
                    key={comp.id}
                    className={`slide-component absolute ${(!isEditing && !readOnly) ? 'cursor-move select-none' : ''} ${(isSelected && !isEditing && !readOnly) ? 'ring-2 ring-lemon ring-offset-2' : ((!readOnly && !isEditing) ? 'hover:border-2 hover:border-gray-200/50' : '')}`}
                    style={{...style, minWidth: '20px', minHeight: '20px'}}
                    onMouseDown={(e) => handleDragStart(e, comp.id)}
                    onTouchStart={(e) => handleDragStart(e, comp.id)}
                    onClick={(e) => { 
                        if(!readOnly) e.stopPropagation(); 
                    }}
                    onDoubleClick={() => handleDoubleClick(comp.id)}
                >
                    {isSelected && !isEditing && !readOnly && (
                         <div className="absolute inset-0 border-2 border-dashed border-obsidian pointer-events-none z-50"></div>
                    )}

                    {isSelected && !isEditing && !readOnly && (
                        <div 
                            className="absolute -top-10 right-0 bg-red-500 text-white p-1.5 rounded cursor-pointer hover:bg-red-600 shadow-md z-50 pointer-events-auto"
                            onClick={(e) => { e.stopPropagation(); onDeleteComponent(comp.id); }}
                            title="Delete Item"
                        >
                            <Trash2 size={16} />
                        </div>
                    )}

                    {comp.type === 'text' && (
                        isEditing && !readOnly ? (
                            <textarea
                                autoFocus
                                className="w-full h-full bg-transparent border-none outline-none resize-none"
                                style={{ 
                                    fontFamily: comp.fontFamily || slide.baseFont || 'sans', 
                                    fontSize: 'inherit', 
                                    color: compTextColor 
                                }}
                                value={comp.content}
                                onChange={(e) => onUpdateComponent(comp.id, { content: e.target.value })}
                                onBlur={() => setEditingId(null)}
                            />
                        ) : (
                            <div className="p-2 min-w-[50px] min-h-[40px] w-full h-full pointer-events-none">
                                <MarkdownRenderer 
                                    content={comp.content || ''} 
                                    font={comp.fontFamily || slide.baseFont || 'sans'} 
                                    textColor={compTextColor}
                                    isGradient={comp.isGradient}
                                />
                            </div>
                        )
                    )}
                    
                    {comp.type === 'image' && (
                         <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden group">
                            {comp.src ? (
                                <img src={comp.src} className="w-full h-full object-cover select-none pointer-events-none" alt="" draggable={false} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center pointer-events-none text-gray-300 border border-gray-200">
                                    <ImageIcon size={32} className="mb-2 opacity-20"/>
                                    <span className="text-[10px] opacity-40">Double click or use toolbar to add image</span>
                                </div>
                            )}
                         </div>
                    )}

                    {comp.type === 'chart' && (
                        <div className="w-full h-full pointer-events-none">
                            <ChartVisualizer 
                                data={comp.chartData} 
                                font={comp.fontFamily || 'sans'} 
                                textColor={compTextColor} 
                                animation={comp.animation}
                                trigger={playAnimations || previewTrigger > 0 || readOnly ? previewTrigger || Date.now() : 0}
                            />
                        </div>
                    )}

                    {comp.type === 'poll' && (
                        <div className="w-full h-full pointer-events-none">
                            <PollVisualizer question={comp.pollQuestion} options={comp.pollOptions} font={comp.fontFamily || 'sans'} textColor={compTextColor} />
                        </div>
                    )}
                    
                    {comp.type === 'custom' && (
                        <div className="w-full h-full pointer-events-none overflow-hidden" dangerouslySetInnerHTML={{ __html: comp.content || '' }}></div>
                    )}

                    {isSelected && !isEditing && !readOnly && (
                        <>
                            {['nw', 'ne', 'sw', 'se'].map(h => (
                                <div 
                                    key={h}
                                    className={`absolute w-3 h-3 bg-white border border-obsidian z-50 pointer-events-auto
                                        ${h === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
                                        ${h === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
                                        ${h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
                                        ${h === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
                                    `}
                                    onMouseDown={(e) => handleResizeStart(e, comp.id, h)}
                                />
                            ))}
                        </>
                    )}
                </div>
            );
        })}
      </div>
      
      {!readOnly && (
          <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 font-mono pointer-events-none">
              Double click to Edit | Shift+Click to Group Select | Drag handles to resize | Scale: {Math.round(scale * 100)}%
          </div>
      )}
    </div>
  );
};