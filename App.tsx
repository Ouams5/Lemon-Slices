import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { INITIAL_PRESENTATION, TOOLS } from './constants';
import { SlideCanvas } from './components/SlideCanvas';
import { Toolbar } from './components/Toolbar';
import { Button } from './components/Button';
import { PresentationData, ToolName, User } from './types';
import { runToneShifter, runImpactScore, runAetherPaint, checkApiKey } from './services/geminiService';
import { Activity, ArrowRight, User as UserIcon, X, Wand2, Play, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<PresentationData>(INITIAL_PRESENTATION);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  
  // Tool Modal State
  const [toolPrompt, setToolPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toolResult, setToolResult] = useState<string | null>(null);

  const currentSlide = data.slides[currentSlideIndex];

  // Auth Simulation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setUser({
      user_id: 'u_123',
      display_name: 'Neo Designer',
      email: 'designer@lemonslices.io',
      created_at: new Date().toISOString(),
      subscription_tier: 'Pro'
    });
  };

  // Tool Execution Logic
  const executeTool = async () => {
    if (!checkApiKey()) {
      setToolResult("API Key not found in environment. Please allow permissions or check setup.");
      return;
    }

    setIsProcessing(true);
    setToolResult(null);

    try {
      let result = '';
      switch (activeTool) {
        case 'Tone-Shifter':
          // For demo, grab first text content of current slide
          const textComponent = currentSlide.components.find(c => c.type === 'text');
          if (textComponent && textComponent.content) {
             result = await runToneShifter(textComponent.content, 'persuasive');
          } else {
             result = "No text found on this slice to shift.";
          }
          break;
        case 'Impact-Score':
           const score = await runImpactScore(currentSlide.title, JSON.stringify(currentSlide.components));
           result = `Slice Impact Score: ${score}/100\nAnalysis: Visuals are strong, but consider reducing text density.`;
           break;
        case 'Aether-Paint':
           result = "Generating image...";
           const imgUrl = await runAetherPaint(toolPrompt || "Abstract neo-brutalist background");
           result = `Image generated successfully! (Mock URL for demo: ${imgUrl})`;
           // In a real app, we'd update the slide state here with the new image
           break;
        default:
           result = `The tool ${activeTool} is ready for integration.`;
      }
      setToolResult(result);
    } catch (e) {
      setToolResult("Error executing tool.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md bg-black/50 border-2 border-cyan p-8 backdrop-blur-md shadow-neon">
          <div className="mb-8 text-center">
             <h1 className="font-display text-4xl font-bold tracking-widest mb-2">LEMON <span className="text-cyan">SLICES</span></h1>
             <p className="text-gray-400 font-sans text-sm">Design Intelligence. Amplified.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-cyan mb-1 uppercase">Identity</label>
              <input type="email" placeholder="user@lemonslices.io" className="w-full bg-obsidian border border-gray-700 p-3 focus:border-cyan focus:outline-none text-white font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-cyan mb-1 uppercase">Passcode</label>
              <input type="password" placeholder="••••••••" className="w-full bg-obsidian border border-gray-700 p-3 focus:border-cyan focus:outline-none text-white font-mono" />
            </div>
            
            <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2">
              Authenticate <ArrowRight size={16} />
            </Button>
            
            <div className="flex items-center gap-2 mt-4 text-gray-500 text-xs justify-center cursor-pointer hover:text-cyan transition-colors">
               <Lock size={12} />
               <span>Biometric Scan Available</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-obsidian text-softwhite overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 z-30 bg-obsidian">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold text-xl tracking-wider">LEMON <span className="text-cyan">SLICES</span></span>
          <span className="text-xs border border-gray-700 px-2 py-0.5 rounded text-gray-400">{data.title}</span>
        </div>
        <div className="flex items-center gap-4">
            <Button size="sm" variant="secondary" className="!px-3 !py-1 flex items-center gap-2">
                <Play size={14} /> Present
            </Button>
            <div className="w-8 h-8 rounded-full border border-cyan bg-cyan/20 flex items-center justify-center">
                <UserIcon size={16} className="text-cyan" />
            </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar */}
        <Toolbar onSelectTool={(id) => setActiveTool(id)} />

        {/* Slide Strip (Navigation) */}
        <div className="w-48 border-r border-gray-800 flex flex-col bg-obsidian/50 overflow-y-auto">
           {data.slides.map((slide, idx) => (
             <div 
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`p-4 border-b border-gray-800 cursor-pointer transition-colors relative ${idx === currentSlideIndex ? 'bg-white/5' : 'hover:bg-white/5'}`}
             >
                <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-gray-500">0{slide.slide_number}</span>
                    {idx === currentSlideIndex && <div className="w-2 h-2 bg-cyan rounded-full shadow-neon"></div>}
                </div>
                <div className="aspect-video bg-gray-900 border border-gray-700 mb-2 p-1 overflow-hidden">
                    {/* Tiny preview */}
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600 text-center leading-none">
                        {slide.title}
                    </div>
                </div>
                <p className="text-xs font-bold truncate">{slide.title}</p>
             </div>
           ))}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#111] relative overflow-auto custom-scrollbar flex items-center justify-center p-12">
            <SlideCanvas slide={currentSlide} />
        </div>

        {/* Right Property Panel / Tool Output */}
        {activeTool && (
             <div className="w-80 border-l border-gray-800 bg-obsidian absolute right-0 top-14 bottom-0 z-40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-2">
                         <Wand2 size={16} className="text-cyan" />
                         <span className="font-display font-bold">{activeTool}</span>
                    </div>
                    <button onClick={() => setActiveTool(null)} className="hover:text-cyan"><X size={18} /></button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">
                            {TOOLS.find(t => t.id === activeTool)?.description}
                        </p>
                    </div>

                    {activeTool === 'Aether-Paint' && (
                        <textarea 
                            className="w-full bg-black border border-gray-700 p-2 text-sm text-white mb-4 h-24 focus:border-cyan outline-none resize-none"
                            placeholder="Describe the image mood..."
                            value={toolPrompt}
                            onChange={(e) => setToolPrompt(e.target.value)}
                        />
                    )}

                    <Button onClick={executeTool} disabled={isProcessing} className="w-full mb-6">
                        {isProcessing ? 'Processing...' : 'Run Magic'}
                    </Button>

                    {toolResult && (
                        <div className="bg-gray-900 border border-cyan/30 p-3 text-sm font-mono text-cyan/90 break-words whitespace-pre-wrap">
                            {toolResult}
                        </div>
                    )}
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");
const root = createRoot(rootElement);
root.render(<App />);