import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_PRESENTATION, BLANK_PRESENTATION, MAGIC_OPTIONS, TEMPLATES, BUILDER_BLOCKS, CATEGORY_COLORS, TEMPLATE_LIBRARY, CHART_ANIMATIONS } from './constants';
import { SlideCanvas } from './components/SlideCanvas';
import { Toolbar } from './components/Toolbar';
import { Button } from './components/Button';
import { DraggableWindow } from './components/DraggableWindow';
import { PresentationData, User, SlideComponent, PluginDefinition, LogicBlock, PluginVariable, Slide } from './types';
import { runToneShifter, runAetherPaint, runDraftToDeck, checkApiKey, runExtensionBuilder } from './services/geminiService';
import PptxGenJS from "pptxgenjs"; 
import { 
    auth, 
    signInWithPopup, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut, 
    db, 
    collection, 
    setDoc, 
    addDoc,
    doc, 
    getDocs, 
    query, 
    where, 
    onAuthStateChanged, 
    FirebaseUser,
    googleProvider
} from './services/firebase';
import { 
    ArrowRight, User as UserIcon, X, Play, 
    PlusSquare, LayoutGrid, LogOut, Download, Sparkles, ChevronLeft, ChevronRight, Globe, Loader2, Mail, Lock, FileOutput,
    Type, Palette, PaintBucket, Minimize2, Image as ImageIcon, Upload, Link, FolderOpen, Blocks, Trash2, 
    Group, Ungroup, BoxSelect, Sun, Eye, ShoppingBag, Store, Maximize, Shapes, Circle, Sticker, StickyNote, CreditCard, Minus, 
    Film, Cpu, PlayCircle, Settings, Variable, Database, CornerDownRight, Layout, AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, Layers
} from 'lucide-react';

type ViewMode = 'auth' | 'dashboard' | 'editor' | 'present';
type MagicMode = 'deck' | 'image' | 'text' | null;
type ExtensionTab = 'installed' | 'shop';

// --- Official Pre-made Extensions ---
const OFFICIAL_PLUGINS: PluginDefinition[] = [
    {
        id: 'ext_resize_master',
        name: 'Resize Master',
        version: '1.0.0',
        description: 'Precise numeric control over component position and dimensions.',
        author: 'Lemon Team',
        icon: 'Maximize',
        logic: [],
        payload: { type: 'custom' } 
    },
    {
        id: 'ext_element_pack',
        name: 'Neo-Elements Pack',
        version: '1.0.0',
        description: 'Adds 5 exclusive Neo-Brutalism elements: Circle, Badge, Note, Card, Divider.',
        author: 'Lemon Team',
        icon: 'Shapes',
        logic: [],
        payload: { type: 'custom' } 
    },
    {
        id: 'ext_better_animations',
        name: 'Better Animations',
        version: '1.0.0',
        description: '25+ New Animations and a Timeline Editor for creating cinematic slides.',
        author: 'Lemon Team',
        icon: 'Film',
        logic: [],
        payload: { type: 'custom' }
    },
    {
        id: 'ext_builder',
        name: 'Extension Builder',
        version: '0.9.0',
        description: 'Design, code, and export your own extensions using a visual block editor.',
        author: 'Lemon Team',
        icon: 'Cpu',
        logic: [],
        payload: { type: 'custom' }
    },
    {
        id: 'ext_templates_plus',
        name: 'Templates+',
        version: '1.0.0',
        description: 'Browse professional slide decks and import individual slices.',
        author: 'Lemon Team',
        icon: 'Layout',
        logic: [],
        payload: { type: 'custom' }
    }
];

const ANIMATION_TYPES = [
    ...CHART_ANIMATIONS,
    'bounceIn', 'bounceInDown', 'fadeIn', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'fadeInUp',
    'flipInX', 'rotateIn', 'zoomInDown', 'jackInTheBox', 'rollIn',
    'bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'tada', 'wobble', 'heartBeat', 'glitch', 'spin'
];

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<ViewMode>('auth');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State
  const [savedDecks, setSavedDecks] = useState<PresentationData[]>([]);
  const [data, setData] = useState<PresentationData>(INITIAL_PRESENTATION);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  
  // Plugin State
  const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
  const [shopPlugins, setShopPlugins] = useState<PluginDefinition[]>([]);
  const [showExtensionWindow, setShowExtensionWindow] = useState(false);
  const [extensionTab, setExtensionTab] = useState<ExtensionTab>('installed');

  // Active Tool State (Extensions)
  const [showResizeTool, setShowResizeTool] = useState(false);
  const [showElementPack, setShowElementPack] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplatesPlus, setShowTemplatesPlus] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Animation State
  const [previewTrigger, setPreviewTrigger] = useState(0);

  // Builder State
  const [builderTab, setBuilderTab] = useState<'meta'|'logic'|'vars'|'magic'>('meta');
  const [builderPrompt, setBuilderPrompt] = useState('');
  const [builderData, setBuilderData] = useState<PluginDefinition>({
      id: `ext_${Date.now()}`,
      name: 'New Extension',
      version: '1.0.0',
      description: 'A cool new tool.',
      author: 'You',
      icon: 'Puzzle',
      logic: [],
      variables: [],
      payload: { type: 'custom', content: 'Generated Extension' }
  });
  const [builderLogic, setBuilderLogic] = useState<LogicBlock[]>([]);
  const [builderVariables, setBuilderVariables] = useState<PluginVariable[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null); // For nested block addition
  
  // Drag State for Variables
  const [draggedVarName, setDraggedVarName] = useState<string | null>(null);

  // Editor State
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  
  const [magicMode, setMagicMode] = useState<MagicMode>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Magic Tool State
  const [magicPrompt, setMagicPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [magicStatus, setMagicStatus] = useState<string>(''); 
  const [magicResult, setMagicResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lpeInputRef = useRef<HTMLInputElement>(null);
  const lpePublishRef = useRef<HTMLInputElement>(null);

  const currentSlide = data.slides[currentSlideIndex] || data.slides[0];

  // --- Auth & Data Loading ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setView('dashboard');
        loadDecks(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadDecks = async (uid: string) => {
      if (uid === 'guest') return;
      try {
          const q = query(collection(db, "presentations"), where("uid", "==", uid));
          const querySnapshot = await getDocs(q);
          const decks: PresentationData[] = [];
          querySnapshot.forEach((doc) => {
              decks.push(doc.data() as PresentationData);
          });
          setSavedDecks(decks);
      } catch (e) {
          console.error("Error loading decks", e);
      }
  };

  const loadShopPlugins = async () => {
      try {
          const querySnapshot = await getDocs(collection(db, "extensions"));
          const shopItems: PluginDefinition[] = [...OFFICIAL_PLUGINS]; 
          querySnapshot.forEach((doc) => {
              const d = doc.data() as any;
              if (d.id && d.name) {
                if (!shopItems.some(p => p.id === d.id)) {
                    shopItems.push(d as PluginDefinition);
                }
              }
          });
          setShopPlugins(shopItems);
      } catch (e) {
          console.error("Error loading shop", e);
          setShopPlugins([...OFFICIAL_PLUGINS]);
      }
  };

  useEffect(() => {
      if (showExtensionWindow && extensionTab === 'shop') {
          loadShopPlugins();
      }
  }, [showExtensionWindow, extensionTab]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) {
        setAuthError("Please fill in all fields");
        return;
    }

    try {
        if (isSignUp) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error: any) {
        console.error("Auth error:", error);
        setAuthError(error.message);
    }
  };

  const handleGuestEntry = async (e: React.MouseEvent) => {
    e.preventDefault();
    const guestUser = {
        uid: 'guest',
        displayName: 'Guest Designer',
        email: null,
        photoURL: null
    } as unknown as FirebaseUser;
    
    setCurrentUser(guestUser);
    setView('dashboard');
    setSavedDecks([INITIAL_PRESENTATION]);
  };

  const handleLogout = async () => {
      if (currentUser?.uid !== 'guest') {
          await signOut(auth);
      }
      setCurrentUser(null);
      setView('auth');
      setEmail('');
      setPassword('');
      setIsSignUp(false);
  };

  const handleCreateNewClick = () => {
      setShowTemplateModal(true);
  };

  const handleSelectTemplate = (templateData: PresentationData) => {
    const newDeck = JSON.parse(JSON.stringify(templateData));
    newDeck.id = `deck_${Date.now()}`;
    newDeck.uid = currentUser?.uid;
    newDeck.created_at = new Date().toISOString();
    setData(newDeck);
    setCurrentSlideIndex(0);
    setShowTemplateModal(false);
    setView('editor');
  };

  const handleOpenDeck = (deck: PresentationData) => {
    setData(deck);
    setCurrentSlideIndex(0);
    setView('editor');
  };

  const handleSaveAndExit = async () => {
    if (!currentUser) return;
    
    if (currentUser.uid === 'guest') {
         const existingIdx = savedDecks.findIndex(d => d.id === data.id);
         if (existingIdx >= 0) {
             const newDecks = [...savedDecks];
             newDecks[existingIdx] = data;
             setSavedDecks(newDecks);
         } else {
             setSavedDecks([...savedDecks, data]);
         }
         setView('dashboard');
         return;
    }

    try {
        await setDoc(doc(db, "presentations", data.id), {
            ...data,
            uid: currentUser.uid, 
            title: data.title || 'Untitled'
        });
        
        const existingIdx = savedDecks.findIndex(d => d.id === data.id);
        if (existingIdx >= 0) {
            const newDecks = [...savedDecks];
            newDecks[existingIdx] = data;
            setSavedDecks(newDecks);
        } else {
            setSavedDecks([...savedDecks, data]);
        }
        setView('dashboard');
    } catch (e) {
        console.error("Save failed", e);
        alert("Failed to save to cloud.");
    }
  };

  const handleLoadLPE = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const loadedPlugin = JSON.parse(event.target?.result as string) as PluginDefinition;
              if (!loadedPlugin.id || !loadedPlugin.name) {
                  throw new Error("Invalid .lpe file structure.");
              }
              if (plugins.some(p => p.id === loadedPlugin.id)) {
                  alert("Plugin already installed!");
                  return;
              }
              setPlugins([...plugins, loadedPlugin]);
              setExtensionTab('installed');
          } catch (err) {
              console.error(err);
              alert("Failed to load plugin.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handlePublishExtension = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (currentUser?.uid === 'guest') {
          alert("Please sign in to publish extensions.");
          e.target.value = ''; // Reset input
          return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const loadedPlugin = JSON.parse(event.target?.result as string) as PluginDefinition;
              
              if (!loadedPlugin.id || !loadedPlugin.name) {
                  throw new Error("Invalid .lpe file structure.");
              }
              
              const confirmPublish = window.confirm(`Publish "${loadedPlugin.name}" v${loadedPlugin.version} to the public shop?`);
              if (!confirmPublish) return;

              // Add metadata
              const pluginDoc = {
                  ...loadedPlugin,
                  publishedBy: currentUser?.uid,
                  publishedAt: new Date().toISOString()
              };

              await addDoc(collection(db, "extensions"), pluginDoc);
              alert("Extension published successfully!");
              loadShopPlugins(); // Refresh shop
          } catch (err) {
              console.error(err);
              alert("Failed to publish extension.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input so change event triggers again next time
  };

  const installFromShop = (plugin: PluginDefinition) => {
      if (plugins.some(p => p.id === plugin.id)) {
          alert("Plugin already installed!");
          return;
      }
      setPlugins([...plugins, plugin]);
      alert(`Installed ${plugin.name}`);
  };

  const removePlugin = (id: string) => {
      setPlugins(plugins.filter(p => p.id !== id));
      if (id === 'ext_resize_master') setShowResizeTool(false);
      if (id === 'ext_element_pack') setShowElementPack(false);
      if (id === 'ext_better_animations') setShowTimeline(false);
      if (id === 'ext_builder') setShowBuilder(false);
      if (id === 'ext_templates_plus') setShowTemplatesPlus(false);
  };

  const handleSaveLPF = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${data.title.replace(/\s+/g, '_')}.lpf`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadLPFClick = () => {
      if(fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.lpf') && !fileName.endsWith('.json')) {
          alert("Please select a valid .lpf (Lemon Presentation File)");
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const loadedData = JSON.parse(event.target?.result as string);
              if (!loadedData.slides || !Array.isArray(loadedData.slides)) {
                  throw new Error("Invalid file structure");
              }
              setData(loadedData);
              setCurrentSlideIndex(0);
              setView('editor');
          } catch (err) {
              console.error(err);
              alert("Failed to read file.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  const handleExportPPTX = () => {
      try {
          const pres = new PptxGenJS();
          pres.layout = 'LAYOUT_16x9';
          pres.title = data.title;
          
          const normalize = (val: string | number | undefined, axis: 'x' | 'y') => {
              if (val === undefined) return axis === 'x' ? '10%' : '10%';
              const strVal = String(val);
              if (strVal.includes('%')) return strVal;
              const numVal = parseFloat(strVal);
              const total = axis === 'x' ? 1000 : 562.5;
              return `${(numVal / total) * 100}%`;
          };

          data.slides.forEach((slide) => {
              const pSlide = pres.addSlide();
              if (slide.backgroundColor) {
                  pSlide.background = { color: slide.backgroundColor.replace('#', '') };
              }

              slide.components.forEach((comp) => {
                  const x = normalize(comp.style?.left, 'x');
                  const y = normalize(comp.style?.top, 'y');
                  const w = normalize(comp.style?.width || '200px', 'x');
                  const h = normalize(comp.style?.height || '100px', 'y');

                  const color = (comp.textColor || comp.style?.color || '#000000').replace('#', '');
                  
                  if (comp.type === 'text') {
                      pSlide.addText(comp.content || '', {
                          x, y, w, h,
                          fontSize: 18,
                          color: color,
                          fontFace: comp.fontFamily === 'serif' ? 'Times New Roman' : comp.fontFamily === 'mono' ? 'Courier New' : 'Arial',
                          align: comp.style?.textAlign || 'left',
                          bold: comp.style?.fontWeight === 'bold',
                      });
                  } else if (comp.type === 'image' && comp.src) {
                      if (comp.src.startsWith('data:')) {
                           pSlide.addImage({
                               data: comp.src,
                               x, y, w, h
                           });
                      } else {
                          pSlide.addImage({
                              path: comp.src,
                              x, y, w, h
                          });
                      }
                  } else if (comp.type === 'chart' && comp.chartData) {
                      const chartData = [
                          {
                              name: "Data",
                              labels: comp.chartData.map(d => d.label),
                              values: comp.chartData.map(d => d.value)
                          }
                      ];
                      pSlide.addChart(pres.ChartType.bar, chartData, { x, y, w, h, barDir: 'col', chartColors: comp.chartData.map(d => d.color?.replace('#', '') || 'DFFF00') });
                  }
              });
          });

          pres.writeFile({ fileName: `${data.title || 'Presentation'}.pptx` });
      } catch (e) {
          console.error("PPTX Export Error", e);
          alert("Could not generate PPTX.");
      }
  };

  // --- Core CRUD ---
  
  const addComponent = (type: string, payload?: any) => {
      let newComp: SlideComponent = {
          id: `c_${Date.now()}`,
          type: type as SlideComponent['type'],
          content: '',
          style: { top: '30%', left: '30%', position: 'absolute' },
          fontFamily: 'sans'
      };

      if (type === 'plugin' && typeof payload === 'string') {
          // Payload is pluginId string
          const plugin = plugins.find(p => p.id === payload);
          if (plugin) {
              if (plugin.logic && plugin.logic.length > 0) {
                  // Execute logic instead of adding simple component
                  executePluginLogic(plugin);
                  return; 
              } else {
                  // Legacy Payload handling
                  newComp.type = plugin.payload.type;
                  newComp.style = { 
                      ...newComp.style, 
                      ...plugin.payload.style,
                      width: plugin.payload.width ? `${plugin.payload.width}px` : '200px',
                      height: plugin.payload.height ? `${plugin.payload.height}px` : '100px'
                  };
                  if (plugin.payload.content) newComp.content = plugin.payload.content;
              }
          }
      } 
      else if (type === 'custom' && typeof payload === 'object') {
          // Payload is Component Partial
          newComp = { ...newComp, ...payload, id: newComp.id, type: 'custom' };
          // Ensure styles merge deeply
          if(payload.style) {
              newComp.style = { ...newComp.style, ...payload.style };
          }
      }
      else if (type === 'text') {
          newComp.content = 'Double click to edit';
          newComp.style = { ...newComp.style, width: '400px', height: 'auto' };
      } else if (type === 'chart') {
          newComp.style = { ...newComp.style, width: '400px', height: '250px' };
          newComp.chartData = [
              { label: 'Item A', value: 45, color: '#DFFF00' },
              { label: 'Item B', value: 80, color: '#000000' },
              { label: 'Item C', value: 30, color: '#FF00FF' }
          ];
      } else if (type === 'poll') {
          newComp.style = { ...newComp.style, width: '300px', height: '200px', backgroundColor: '#ffffff' };
          newComp.pollQuestion = 'What is your favorite color?';
          newComp.pollOptions = [
              { id: '1', text: 'Lemon', votes: 40 },
              { id: '2', text: 'Obsidian', votes: 60 }
          ];
      } else if (type === 'image') {
          newComp.content = 'Image';
          newComp.style = { ...newComp.style, width: '300px', height: '200px' };
      }

      const newSlides = [...data.slides];
      newSlides[currentSlideIndex].components.push(newComp);
      setData({ ...data, slides: newSlides });
      setSelectedComponentIds([newComp.id]);
  };

  const updateComponent = (id: string, updates: Partial<SlideComponent>) => {
    const newSlides = [...data.slides];
    const slide = newSlides[currentSlideIndex];
    const compIndex = slide.components.findIndex(c => c.id === id);
    if (compIndex > -1) {
      slide.components[compIndex] = { ...slide.components[compIndex], ...updates };
      setData({ ...data, slides: newSlides });
    }
  };

  const deleteComponent = (id: string) => {
    const newSlides = [...data.slides];
    const slide = newSlides[currentSlideIndex];
    slide.components = slide.components.filter(c => c.id !== id);
    setData({ ...data, slides: newSlides });
    setSelectedComponentIds(prev => prev.filter(pid => pid !== id));
  };

  const updateSelectedComponents = (updates: Partial<SlideComponent> | ((prev: SlideComponent) => Partial<SlideComponent>)) => {
      const newSlides = [...data.slides];
      const slide = newSlides[currentSlideIndex];
      
      slide.components = slide.components.map(c => {
          if (selectedComponentIds.includes(c.id)) {
             const newUpdates = typeof updates === 'function' ? updates(c) : updates;
             return { ...c, ...newUpdates };
          }
          return c;
      });
      setData({ ...data, slides: newSlides });
  };

  // --- Logic & Magic ---

  const executePluginLogic = async (plugin: PluginDefinition) => {
      const runBlock = async (block: LogicBlock) => {
          const { type, params, children } = block;
          
          if (type === 'create_text') {
              addComponent('text', { content: params.content, style: { left: `${params.x}%`, top: `${params.y}%`, color: params.color, fontFamily: params.font } });
          } else if (type === 'create_image') {
              addComponent('image', { src: params.src, style: { left: `${params.x}%`, top: `${params.y}%`, width: `${params.width}px`, height: `${params.height}px` } });
          } else if (type === 'create_shape') {
               const shapeHtml = params.shape === 'circle' 
                  ? `<div style="width:100%;height:100%;background:${params.color};border-radius:50%"></div>`
                  : `<div style="width:100%;height:100%;background:${params.color}"></div>`;
               addComponent('custom', { content: shapeHtml, style: { left: `${params.x}%`, top: `${params.y}%`, width: `${params.size}px`, height: `${params.size}px` } });
          } else if (type === 'sys_alert') {
              alert(params.message);
          } else if (type === 'flow_repeat') {
              const times = parseInt(params.times) || 1;
              for(let i=0; i<times; i++) {
                  if (children) {
                      for(const child of children) await runBlock(child);
                  }
              }
          }
      };

      for (const block of plugin.logic) {
          await runBlock(block);
      }
  };

  const runMagic = async () => {
      if (!magicPrompt) return;
      setIsProcessing(true);
      setMagicStatus('Conjuring...');
      setMagicResult(null);

      try {
          if (magicMode === 'deck') {
              setMagicStatus('Drafting slides...');
              const deck = await runDraftToDeck(magicPrompt);
              if (deck) {
                 const newDeck = { ...BLANK_PRESENTATION, ...deck, id: `deck_${Date.now()}` };
                 setData(newDeck);
                 setCurrentSlideIndex(0);
                 setMagicMode(null);
              }
          } else if (magicMode === 'image') {
              setMagicStatus('Painting pixels...');
              const url = await runAetherPaint(magicPrompt);
              addComponent('image', { src: url });
              setMagicMode(null);
          } else if (magicMode === 'text') {
               if (selectedComponentIds.length === 1) {
                   const comp = currentSlide.components.find(c => c.id === selectedComponentIds[0]);
                   if (comp && comp.type === 'text') {
                       setMagicStatus('Polishing prose...');
                       const newText = await runToneShifter(comp.content || '', 'concise'); 
                       updateComponent(comp.id, { content: newText });
                       setMagicMode(null);
                   } else {
                       setMagicResult("Select a text component first.");
                   }
               } else {
                   setMagicResult("Select one text component.");
               }
          }
      } catch (e) {
          console.error(e);
          setMagicResult("Magic failed. Try again.");
      }
      setIsProcessing(false);
      setMagicStatus('');
  };

  // --- Templates+ ---

  const handleAddSlideFromTemplate = (slide: Slide) => {
      const newSlide = JSON.parse(JSON.stringify(slide));
      newSlide.id = `s_${Date.now()}`;
      newSlide.slide_number = data.slides.length + 1;
      newSlide.components.forEach((c: SlideComponent) => {
          c.id = `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      });
      
      const newSlides = [...data.slides, newSlide];
      setData({ ...data, slides: newSlides });
      setCurrentSlideIndex(newSlides.length - 1);
      setShowTemplatesPlus(false);
  };

  // --- Builder Logic ---

  const addBuilderBlock = (type: string, params: any[]) => {
      const newBlock: LogicBlock = {
          id: `b_${Date.now()}`,
          type,
          params: params.reduce((acc: any, p: any) => ({ ...acc, [p.name]: p.default }), {})
      };
      
      if (selectedParentId) {
          // Recursive add
          const addRecursive = (blocks: LogicBlock[]): LogicBlock[] => {
              return blocks.map(b => {
                  if (b.id === selectedParentId) {
                      return { ...b, children: [...(b.children || []), newBlock] };
                  }
                  if (b.children) {
                      return { ...b, children: addRecursive(b.children) };
                  }
                  return b;
              });
          };
          setBuilderLogic(addRecursive(builderLogic));
      } else {
          setBuilderLogic([...builderLogic, newBlock]);
      }
  };

  const handleVarDragStart = (e: React.DragEvent, name: string) => {
      setDraggedVarName(name);
  };

  const runBuilderMagic = async () => {
      if (!builderPrompt) return;
      setIsProcessing(true);
      const res = await runExtensionBuilder(builderPrompt);
      if (res && res.logic) {
          setBuilderLogic(res.logic);
          if (res.name) setBuilderData(prev => ({ ...prev, name: res.name, description: res.description }));
      }
      setIsProcessing(false);
  };

  const handleExportBuilder = () => {
      const plugin: PluginDefinition = {
          ...builderData,
          logic: builderLogic,
          variables: builderVariables
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plugin, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${plugin.name.replace(/\s+/g, '_')}.lpe`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const renderBlockInputs = (block: LogicBlock) => {
      const def = Object.values(BUILDER_BLOCKS).flat().find((b: any) => b.type === block.type) as any;
      if (!def) return null;

      return (
          <div key={block.id} className="bg-white border border-gray-300 p-2 rounded mb-2 shadow-sm relative group">
              <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">{def.label}</span>
                  <div className="flex gap-1">
                      {def.container && <button onClick={() => setSelectedParentId(block.id)} className="text-[10px] text-blue-500 bg-blue-50 px-1 rounded hover:bg-blue-100">+ Add Child</button>}
                      <button onClick={() => {
                          const removeRecursive = (blocks: LogicBlock[]): LogicBlock[] => {
                              return blocks.filter(b => b.id !== block.id).map(b => ({ ...b, children: b.children ? removeRecursive(b.children) : undefined }));
                          };
                          setBuilderLogic(removeRecursive(builderLogic));
                      }} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  {def.params.map((p: any) => (
                      <div key={p.name} className="flex flex-col">
                          <label className="text-[9px] text-gray-500 uppercase">{p.name}</label>
                          <input 
                              className={`border p-1 text-xs ${p.type === 'color' ? 'h-6' : ''}`} 
                              type={p.type === 'number' ? 'number' : p.type === 'color' ? 'color' : 'text'}
                              value={block.params[p.name]}
                              onDrop={(e) => {
                                  e.preventDefault();
                                  if (draggedVarName) {
                                      const newVal = `{{${draggedVarName}}}`;
                                      // Update block param
                                      const updateRecursive = (blocks: LogicBlock[]): LogicBlock[] => {
                                          return blocks.map(b => {
                                              if (b.id === block.id) return { ...b, params: { ...b.params, [p.name]: newVal } };
                                              if (b.children) return { ...b, children: updateRecursive(b.children) };
                                              return b;
                                          });
                                      };
                                      setBuilderLogic(updateRecursive(builderLogic));
                                      setDraggedVarName(null);
                                  }
                              }}
                              onDragOver={e => e.preventDefault()}
                              onChange={(e) => {
                                  const updateRecursive = (blocks: LogicBlock[]): LogicBlock[] => {
                                      return blocks.map(b => {
                                          if (b.id === block.id) return { ...b, params: { ...b.params, [p.name]: e.target.value } };
                                          if (b.children) return { ...b, children: updateRecursive(b.children) };
                                          return b;
                                      });
                                  };
                                  setBuilderLogic(updateRecursive(builderLogic));
                              }}
                          />
                      </div>
                  ))}
              </div>
              {block.children && block.children.length > 0 && (
                  <div className="pl-4 border-l-2 border-gray-200 mt-2">
                      {block.children.map(child => renderBlockInputs(child))}
                  </div>
              )}
          </div>
      );
  };

  const handleRunPlugin = (plugin: PluginDefinition) => {
      if (plugin.id === 'ext_resize_master') setShowResizeTool(true);
      else if (plugin.id === 'ext_element_pack') setShowElementPack(true);
      else if (plugin.id === 'ext_better_animations') setShowTimeline(true);
      else if (plugin.id === 'ext_builder') setShowBuilder(true);
      else if (plugin.id === 'ext_templates_plus') setShowTemplatesPlus(true);
      else addComponent('plugin', plugin.id);
      setShowExtensionWindow(false);
  };

  // --- Render Helpers ---

  const renderHeader = () => {
      if (view === 'auth') return null;

      if (view === 'dashboard') {
          return (
              <div className="flex items-center gap-4">
                  {currentUser?.uid !== 'guest' && <div className="hidden md:flex flex-col items-end"><span className="text-xs font-bold">{currentUser?.email}</span><span className="text-[10px] text-gray-500">PRO PLAN</span></div>}
                  <Button onClick={handleCreateNewClick} size="sm" className="hidden md:block">+ NEW DECK</Button>
                  <Button onClick={handleLoadLPFClick} size="sm" variant="secondary" className="hidden md:block">IMPORT</Button>
                  <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full"><LogOut size={20}/></button>
              </div>
          );
      }

      // Editor Header
      return (
          <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex gap-2">
                  <button onClick={() => setMagicMode('deck')} className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-sm font-bold text-xs hover:opacity-90 transition-opacity"><Sparkles size={12}/> MAGIC DECK</button>
                  <button onClick={() => setMagicMode('image')} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-sm font-bold text-xs hover:bg-gray-200"><Sparkles size={12} className="text-purple-500"/> IMG</button>
                  <button onClick={() => setMagicMode('text')} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-sm font-bold text-xs hover:bg-gray-200"><Sparkles size={12} className="text-blue-500"/> TEXT</button>
              </div>

              <div className="h-6 w-0.5 bg-gray-300 hidden md:block"></div>

              <div className="flex gap-2">
                   <button onClick={handleSaveLPF} className="p-2 hover:bg-gray-100 rounded" title="Save .lpf"><Download size={18}/></button>
                   <button onClick={handleExportPPTX} className="p-2 hover:bg-gray-100 rounded" title="Export PPTX"><FileOutput size={18}/></button>
                   <button onClick={() => setView('present')} className="bg-obsidian text-lemon px-4 py-1.5 font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-hard"><Play size={14}/> PLAY</button>
              </div>
          </div>
      );
  };

  const renderPropertiesBar = () => {
      const count = selectedComponentIds.length;
      if (count === 0) return null;

      const firstId = selectedComponentIds[0];
      const comp = currentSlide.components.find(c => c.id === firstId);

      return (
          <div className="flex items-center gap-3 bg-white px-4 py-1 border-2 border-obsidian shadow-sm animate-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase">{count} Selected</span>
              <div className="h-4 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded" title="Bring to Front" onClick={() => {
                      const newSlides = [...data.slides];
                      const s = newSlides[currentSlideIndex];
                      // Move selected to end of array
                      const selected = s.components.filter(c => selectedComponentIds.includes(c.id));
                      const others = s.components.filter(c => !selectedComponentIds.includes(c.id));
                      s.components = [...others, ...selected];
                      setData({...data, slides: newSlides});
                  }}><Layers size={14}/></button>
              </div>

              <div className="h-4 w-px bg-gray-300"></div>

              {/* Color Picker */}
              <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded flex items-center gap-1"><Palette size={14}/></button>
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white border-2 border-obsidian shadow-hard hidden group-hover:grid grid-cols-4 gap-1 w-32 z-50">
                      {['#000000', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'].map(c => (
                          <button key={c} className="w-6 h-6 border border-gray-200" style={{backgroundColor: c}} onClick={() => updateSelectedComponents({ textColor: c })}></button>
                      ))}
                  </div>
              </div>

              {/* Font Picker */}
              <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded flex items-center gap-1"><Type size={14}/></button>
                  <div className="absolute top-full left-0 mt-2 p-1 bg-white border-2 border-obsidian shadow-hard hidden group-hover:flex flex-col gap-1 w-24 z-50">
                      {['sans', 'serif', 'mono', 'display'].map(f => (
                          <button key={f} className={`text-xs p-1 hover:bg-lemon text-left font-${f}`} onClick={() => updateSelectedComponents({ fontFamily: f as any })}>{f}</button>
                      ))}
                  </div>
              </div>

              <div className="h-4 w-px bg-gray-300"></div>
              <button onClick={() => selectedComponentIds.forEach(id => deleteComponent(id))} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
          </div>
      );
  };

  // --- Views ---

  if (view === 'auth') {
     return (
        <div className="w-full h-full flex items-center justify-center bg-paper relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            <div className="w-full max-w-md bg-white border-2 border-obsidian shadow-hard p-8 z-10 relative">
                 <div className="flex justify-center mb-6">
                     <div className="w-16 h-16 bg-lemon border-2 border-obsidian flex items-center justify-center text-3xl font-bold font-display shadow-sm">L</div>
                 </div>
                 <h1 className="text-3xl font-display font-bold text-center mb-2 uppercase">Lemon Slices</h1>
                 <p className="text-center text-gray-500 mb-8 font-mono text-xs">The Neo-Brutalism Presentation Engine</p>
                 
                 {authError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-xs font-bold">{authError}</div>}

                 <form onSubmit={handleEmailAuth} className="space-y-4">
                     <div>
                         <label className="block font-bold text-xs uppercase mb-1">Email</label>
                         <input className="w-full border-2 border-obsidian p-2 font-mono text-sm focus:bg-lemon/10 outline-none transition-colors" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                     </div>
                     <div>
                         <label className="block font-bold text-xs uppercase mb-1">Password</label>
                         <input className="w-full border-2 border-obsidian p-2 font-mono text-sm focus:bg-lemon/10 outline-none transition-colors" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                     </div>
                     <Button type="submit" className="w-full">{isSignUp ? 'Create Account' : 'Sign In'}</Button>
                 </form>
                 
                 <div className="mt-4 text-center">
                     <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs underline hover:text-lemon-600 font-bold">
                         {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                     </button>
                 </div>
                 
                 <div className="my-6 flex items-center gap-2 opacity-50"><div className="h-px bg-gray-300 flex-1"></div><span className="text-[10px] font-bold">OR</span><div className="h-px bg-gray-300 flex-1"></div></div>
                 
                 <Button variant="secondary" className="w-full mb-2" onClick={() => signInWithPopup(auth, googleProvider)}>Sign in with Google</Button>
                 <button onClick={handleGuestEntry} className="w-full text-xs text-gray-400 hover:text-obsidian font-bold py-2">Continue as Guest</button>
            </div>
        </div>
     );
  }

  if (view === 'present') {
      const s = data.slides[currentSlideIndex];
      return (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
               <div className="w-full h-full flex items-center justify-center scale-90 md:scale-100">
                    <SlideCanvas slide={s} selectedIds={[]} onSelect={() => {}} onMultiSelect={() => {}} onUpdateComponent={() => {}} onDeleteComponent={() => {}} onUpdateMultiple={() => {}} previewTrigger={Date.now()} readOnly={true} />
               </div>
               
               {/* Controls */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 text-white z-50">
                    <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft/></button>
                    <span className="font-mono font-bold flex items-center">{currentSlideIndex + 1} / {data.slides.length}</span>
                    <button onClick={() => setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronRight/></button>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <button onClick={() => setView('editor')} className="p-2 hover:bg-white/20 rounded-full transition-colors"><Minimize2 size={20}/></button>
               </div>
          </div>
      );
  }

  if (view === 'dashboard') {
      return (
          <div className="w-full h-full bg-paper flex flex-col">
               {renderHeader()}
               <div className="flex-1 p-8 overflow-y-auto">
                   <div className="max-w-6xl mx-auto">
                       <h2 className="text-4xl font-display font-bold mb-8 uppercase">Your Decks</h2>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           <div onClick={handleCreateNewClick} className="aspect-video border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-lemon hover:bg-lemon/10 transition-all group bg-gray-50">
                               <PlusSquare size={48} className="text-gray-300 group-hover:text-lemon mb-4 transition-colors"/>
                               <span className="font-bold text-gray-500 group-hover:text-obsidian uppercase">Create New</span>
                           </div>

                           {savedDecks.map(deck => (
                               <div key={deck.id} onClick={() => handleOpenDeck(deck)} className="group cursor-pointer">
                                   <div className="aspect-video bg-white border-2 border-obsidian shadow-sm group-hover:shadow-hard transition-all relative overflow-hidden mb-3">
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                            <span className="font-display font-bold text-3xl text-gray-300 uppercase select-none">{deck.title.substring(0, 2)}</span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            {deck.slides.length} Slides
                                        </div>
                                   </div>
                                   <h3 className="font-bold text-lg leading-tight truncate">{deck.title}</h3>
                                   <p className="text-xs text-gray-500">{new Date(deck.created_at || Date.now()).toLocaleDateString()}</p>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
               
               {showTemplateModal && (
                  <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
                      <div className="bg-white border-2 border-obsidian p-6 w-full max-w-3xl shadow-hard relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                          <button onClick={() => setShowTemplateModal(false)} className="absolute top-2 right-2 hover:bg-gray-100 p-1 rounded"><X size={16} /></button>
                          <h3 className="font-display font-bold text-xl uppercase mb-6">Choose a Template</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {TEMPLATES.map(t => (
                                  <div key={t.id} onClick={() => handleSelectTemplate(t.data)} className="group cursor-pointer">
                                      <div className="aspect-video bg-gray-100 border-2 border-gray-200 group-hover:border-lemon group-hover:shadow-hard transition-all relative overflow-hidden">
                                          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: t.color }}>
                                              {t.id === 'blank' && <PlusSquare size={32} className="text-gray-300"/>}
                                              {t.id === 'midnight' && <div className="text-white font-bold font-display text-2xl">M</div>}
                                              {t.id === 'swiss' && <div className="text-black font-bold font-sans text-2xl tracking-tighter">Sw</div>}
                                          </div>
                                      </div>
                                      <h4 className="font-bold mt-2 text-sm">{t.label}</h4>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- Editor View ---

  return (
    <div className="h-screen w-screen flex flex-col bg-paper text-obsidian overflow-hidden select-none font-sans">
      {/* ... Header ... */}
      <header className="h-16 border-b-2 border-obsidian flex items-center justify-between px-4 md:px-6 z-20 bg-white shadow-sm shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 shrink-0" onClick={handleSaveAndExit}>
            <div className="bg-obsidian text-white p-1 rounded-sm"><LayoutGrid size={16}/></div>
            <span className="font-display font-bold text-xl tracking-wider hidden md:block">LEMON <span className="text-black bg-lemon px-1">SLICES</span></span>
          </div>
          
          <div className="h-6 w-0.5 bg-gray-300 hidden md:block shrink-0"></div>

          {selectedComponentIds.length === 0 ? (
                <>
                    <input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} className="text-sm font-bold text-gray-500 uppercase bg-transparent border-b border-transparent focus:border-lemon focus:outline-none hover:border-gray-300 min-w-0 w-full md:w-auto" />
                    
                    {/* Slide Settings Toolbar (Visible when nothing is selected) */}
                    <div className="h-6 w-px bg-gray-300 mx-4 hidden md:block"></div>
                    <div className="hidden md:flex items-center gap-3">
                         {/* Transition Picker */}
                         <div className="relative group">
                             <button className="flex items-center gap-2 text-[10px] font-bold uppercase hover:bg-gray-100 px-2 py-1.5 rounded transition-colors border border-transparent hover:border-gray-200" title="Slide Animation">
                                <Film size={14} className="text-gray-500"/> 
                                <span>{data.slides[currentSlideIndex].transition || 'None'}</span>
                             </button>
                             <div className="absolute top-full left-0 mt-2 p-1 bg-white border-2 border-obsidian shadow-hard hidden group-hover:flex flex-col gap-1 w-24 z-50">
                                  {['none', 'fade', 'slide', 'zoom'].map(t => (
                                      <button 
                                        key={t} 
                                        className={`text-xs p-1 hover:bg-lemon text-left capitalize ${data.slides[currentSlideIndex].transition === t ? 'font-bold bg-gray-50' : ''}`}
                                        onClick={() => {
                                            const newSlides = [...data.slides];
                                            newSlides[currentSlideIndex].transition = t as any;
                                            setData({...data, slides: newSlides});
                                        }}
                                      >
                                          {t}
                                      </button>
                                  ))}
                             </div>
                         </div>

                         {/* Background Color Picker */}
                         <div className="relative group">
                             <button className="flex items-center gap-2 text-[10px] font-bold uppercase hover:bg-gray-100 px-2 py-1.5 rounded transition-colors border border-transparent hover:border-gray-200" title="Background Color">
                                <div className="w-3.5 h-3.5 border border-gray-300" style={{ backgroundColor: data.slides[currentSlideIndex].backgroundColor || '#fff' }}></div>
                                <span>BG</span>
                             </button>
                             <div className="absolute top-full left-0 mt-2 p-2 bg-white border-2 border-obsidian shadow-hard hidden group-hover:grid grid-cols-4 gap-1 w-32 z-50">
                                  {['#ffffff', '#000000', '#f3f4f6', '#fef08a', '#dcfce7', '#dbeafe', '#fae8ff', '#ffedd5'].map(c => (
                                      <button key={c} className="w-6 h-6 border border-gray-200 hover:scale-110 transition-transform" style={{backgroundColor: c}} onClick={() => {
                                          const newSlides = [...data.slides];
                                          newSlides[currentSlideIndex].backgroundColor = c;
                                          setData({...data, slides: newSlides});
                                      }}></button>
                                  ))}
                             </div>
                         </div>
                    </div>
                </>
          ) : (
                <div className="flex-1 overflow-hidden h-full flex items-center animate-fade">
                    {renderPropertiesBar()}
                </div>
          )}
        </div>
        {renderHeader()}
      </header>

      {/* 2. Main Workspace (Flex Row) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-0">
        
        {/* Toolbar (Standard + Plugins) */}
        <div className="hidden md:flex w-20 border-r-2 border-obsidian bg-white flex-col items-center py-4 z-10 shrink-0">
             <Toolbar onAddComponent={(type) => addComponent(type)} onOpenExtensions={() => setShowExtensionWindow(!showExtensionWindow)} plugins={plugins} />
        </div>

        {/* Sidebar (Slide List) */}
        <div className="hidden md:flex w-60 border-r-2 border-obsidian flex-col bg-ui shrink-0 z-10">
           <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
               {data.slides.map((slide, idx) => (
                 <div key={slide.id} onClick={() => { setCurrentSlideIndex(idx); setSelectedComponentIds([]); }} className={`p-4 border-b-2 border-gray-200 cursor-pointer transition-all relative group ${idx === currentSlideIndex ? 'bg-white border-l-[6px] border-l-lemon' : 'hover:bg-white border-l-[6px] border-l-transparent'}`}>
                    <div className="flex justify-between items-center mb-2"><span className="font-mono text-xs font-bold text-gray-400 group-hover:text-obsidian">0{slide.slide_number}</span>{idx === currentSlideIndex && <div className="w-2 h-2 bg-lemon border border-obsidian rounded-full"></div>}</div>
                    <div className={`aspect-video border-2 ${idx === currentSlideIndex ? 'border-obsidian shadow-hard' : 'border-gray-300'} mb-2 p-1 overflow-hidden transition-all pointer-events-none bg-white relative`}>
                        {/* Simple Thumbnail Preview */}
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[8px] text-gray-400 text-center leading-none select-none overflow-hidden">
                            {slide.title || 'Untitled'}
                        </div>
                    </div>
                    <p className="text-xs font-bold truncate text-obsidian">{slide.title}</p>
                 </div>
               ))}
           </div>
           <div className="p-4 bg-white border-t-2 border-gray-200">
               <button onClick={() => { const newSlide = { slide_number: data.slides.length + 1, id: `s_${Date.now()}`, title: 'New Slide', components: [], animations: [], duration_seconds: 10, backgroundColor: '#ffffff' }; setData({...data, slides: [...data.slides, newSlide]}); }} className="w-full py-3 border-2 border-dashed border-gray-300 rounded hover:border-obsidian hover:bg-lemon/20 text-xs font-bold uppercase transition-all">+ Add Slide</button>
           </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-ui relative overflow-hidden flex items-center justify-center p-4 md:p-12 mb-16 md:mb-0 z-0">
            <SlideCanvas slide={currentSlide} selectedIds={selectedComponentIds} onSelect={(id) => { if (id === null) setSelectedComponentIds([]); else setSelectedComponentIds([id]); }} onMultiSelect={(ids) => setSelectedComponentIds(ids)} onUpdateComponent={updateComponent} onDeleteComponent={deleteComponent} onUpdateMultiple={updateSelectedComponents} previewTrigger={previewTrigger} />
        </div>
      </div>

      {/* 3. Global Overlays & Modals */}
      
      {/* ... (Existing Magic Modal and Template Modal) ... */}
      {magicMode && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white border-2 border-obsidian p-6 w-full max-w-md shadow-hard relative animate-in fade-in zoom-in duration-200">
                  <button onClick={() => setMagicMode(null)} className="absolute top-2 right-2 hover:bg-gray-100 p-1 rounded"><X size={16} /></button>
                  <div className="flex items-center gap-2 mb-4 text-lemon-600">
                      <Sparkles className="text-obsidian fill-lemon" />
                      <h3 className="font-display font-bold text-xl uppercase">Magic {magicMode}</h3>
                  </div>
                  <textarea autoFocus className="w-full h-32 border-2 border-gray-200 p-3 mb-4 focus:border-lemon focus:outline-none resize-none font-sans text-sm" placeholder={magicMode === 'deck' ? "Topic: e.g., 'Future of AI in 2025'..." : magicMode === 'image' ? "Describe visuals..." : "Content to rewrite..."} value={magicPrompt} onChange={e => setMagicPrompt(e.target.value)} />
                  {magicStatus && <div className="text-lemon-600 text-xs mb-4 font-bold flex items-center gap-2"><Loader2 className="animate-spin" size={12}/> {magicStatus}</div>}
                  {magicResult && <div className="text-red-500 text-xs mb-4 font-bold">{magicResult}</div>}
                  <Button onClick={runMagic} disabled={isProcessing} className="w-full">{isProcessing ? 'Working Magic...' : 'Generate'}</Button>
              </div>
          </div>
      )}

      {showTemplateModal && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white border-2 border-obsidian p-6 w-full max-w-3xl shadow-hard relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                  <button onClick={() => setShowTemplateModal(false)} className="absolute top-2 right-2 hover:bg-gray-100 p-1 rounded"><X size={16} /></button>
                  <h3 className="font-display font-bold text-xl uppercase mb-6">Choose a Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {TEMPLATES.map(t => (
                          <div key={t.id} onClick={() => handleSelectTemplate(t.data)} className="group cursor-pointer">
                              <div className="aspect-video bg-gray-100 border-2 border-gray-200 group-hover:border-lemon group-hover:shadow-hard transition-all relative overflow-hidden">
                                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: t.color }}>
                                      {t.id === 'blank' && <PlusSquare size={32} className="text-gray-300"/>}
                                      {t.id === 'midnight' && <div className="text-white font-bold font-display text-2xl">M</div>}
                                      {t.id === 'swiss' && <div className="text-black font-bold font-sans text-2xl tracking-tighter">Sw</div>}
                                  </div>
                              </div>
                              <h4 className="font-bold mt-2 text-sm">{t.label}</h4>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* ... (Existing Extension Windows) ... */}
      
      {showTemplatesPlus && (
          <DraggableWindow title="Templates+" onClose={() => setShowTemplatesPlus(false)} className="w-[800px] h-[600px]" initialPos={{x: 100, y: 100}}>
              {/* Templates+ Content */}
              <div className="flex flex-col h-full bg-white">
                 {!activeTemplateId ? (
                     <div className="p-6">
                         <h2 className="text-xl font-bold font-display uppercase mb-4">Select a Deck Template</h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {TEMPLATE_LIBRARY.map(t => (
                                 <div 
                                    key={t.id} 
                                    className="border-2 border-gray-200 p-4 hover:border-obsidian hover:shadow-hard cursor-pointer transition-all bg-gray-50 hover:bg-white"
                                    onClick={() => setActiveTemplateId(t.id)}
                                 >
                                     <div className="aspect-video bg-white border border-gray-300 mb-2 flex items-center justify-center">
                                         <Layout size={32} className="text-gray-300"/>
                                     </div>
                                     <h3 className="font-bold text-sm">{t.title}</h3>
                                     <p className="text-[10px] text-gray-500">{t.slides.length} Slices</p>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col h-full">
                         <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
                             <button onClick={() => setActiveTemplateId(null)} className="p-2 hover:bg-gray-200 rounded-full"><ArrowRight className="rotate-180" size={16}/></button>
                             <div>
                                 <h2 className="font-bold text-sm uppercase">{TEMPLATE_LIBRARY.find(t => t.id === activeTemplateId)?.title}</h2>
                                 <p className="text-[10px] text-gray-500">Click a slice to add components to your current slide.</p>
                             </div>
                         </div>
                         <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                             <div className="grid grid-cols-2 gap-6">
                                 {TEMPLATE_LIBRARY.find(t => t.id === activeTemplateId)?.slides.map((s, idx) => (
                                     <div 
                                        key={s.id} 
                                        className="group relative cursor-pointer"
                                        onClick={() => handleAddSlideFromTemplate(s as Slide)}
                                     >
                                         <div className="aspect-video bg-white border-2 border-gray-300 group-hover:border-lemon shadow-sm group-hover:shadow-hard transition-all relative overflow-hidden">
                                              {/* Simple preview box */}
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                  <span className="text-xs text-gray-400 font-mono">SLICE PREVIEW</span>
                                              </div>
                                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                                                  <span className="bg-lemon text-obsidian px-2 py-1 text-xs font-bold shadow-sm">+ ADD SLICE</span>
                                              </div>
                                         </div>
                                         <p className="text-center text-xs font-bold mt-2 text-gray-600 group-hover:text-obsidian">Slice {idx + 1}: {s.title}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                 )}
              </div>
          </DraggableWindow>
      )}

      {showBuilder && (
          <DraggableWindow title="EXTENSION BUILDER" onClose={() => setShowBuilder(false)} className="w-[900px] h-[650px]" initialPos={{x: 50, y: 50}}>
              {/* ... Builder UI ... */}
              <div className="flex flex-col h-full bg-white">
                  {/* Tabs */}
                  <div className="flex border-b border-obsidian shrink-0">
                      <button onClick={() => setBuilderTab('meta')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'meta' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Metadata</button>
                      <button onClick={() => setBuilderTab('logic')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'logic' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Visual Scripting</button>
                      <button onClick={() => setBuilderTab('vars')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'vars' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Variables</button>
                      <button onClick={() => setBuilderTab('magic')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'magic' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Magic Gen</button>
                  </div>
                  
                  {/* ... Builder Content ... */}
                  <div className="flex-1 overflow-hidden flex">
                      {/* Meta Tab */}
                      {builderTab === 'meta' && (
                          <div className="p-4 w-full space-y-4 overflow-y-auto">
                              <div><label className="text-xs font-bold block mb-1">EXTENSION NAME</label><input className="w-full border-2 border-gray-200 p-2 text-sm focus:border-obsidian outline-none" value={builderData.name} onChange={e => setBuilderData({...builderData, name: e.target.value})} /></div>
                              <div><label className="text-xs font-bold block mb-1">DESCRIPTION</label><textarea className="w-full border-2 border-gray-200 p-2 text-sm h-24 resize-none focus:border-obsidian outline-none" value={builderData.description} onChange={e => setBuilderData({...builderData, description: e.target.value})} /></div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="text-xs font-bold block mb-1">VERSION</label><input className="w-full border-2 border-gray-200 p-2 text-sm focus:border-obsidian outline-none" value={builderData.version} onChange={e => setBuilderData({...builderData, version: e.target.value})} /></div>
                                  <div><label className="text-xs font-bold block mb-1">AUTHOR</label><input className="w-full border-2 border-gray-200 p-2 text-sm focus:border-obsidian outline-none" value={builderData.author} onChange={e => setBuilderData({...builderData, author: e.target.value})} /></div>
                              </div>
                          </div>
                      )}

                      {/* Logic Tab */}
                      {builderTab === 'logic' && (
                          <>
                              <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 overflow-y-auto custom-scrollbar shrink-0">
                                  <div className="mb-2">
                                      <div className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase bg-gray-100 sticky top-0 border-b border-gray-200">VARIABLES</div>
                                      <div className="p-2 space-y-2">
                                          {builderVariables.length === 0 ? <div className="text-[9px] text-gray-400 italic px-2">No vars defined in Variables tab.</div> : 
                                              builderVariables.map(v => (
                                                  <div key={v.id} draggable onDragStart={(e) => handleVarDragStart(e, v.name)} className="bg-lemon text-obsidian rounded-full px-3 py-1 text-xs font-bold border border-obsidian cursor-grab active:cursor-grabbing inline-block mr-2 mb-2 shadow-sm">
                                                      {v.name}
                                                  </div>
                                              ))
                                          }
                                      </div>
                                  </div>
                                  {Object.entries(BUILDER_BLOCKS).map(([category, blocks]) => (
                                      <div key={category} className="mb-2">
                                          <div className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase bg-gray-100 sticky top-0 border-b border-gray-200">{category}</div>
                                          <div className="p-2 space-y-2">
                                              {blocks.map((b: any) => (
                                                  <div key={b.type} onClick={() => addBuilderBlock(b.type, b.params)} className={`p-2 rounded text-xs cursor-pointer shadow-sm active:scale-95 select-none transition-transform font-bold border-b-2 ${CATEGORY_COLORS[category]}`}>
                                                      {b.label}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex-1 bg-ui p-4 overflow-y-auto custom-scrollbar relative">
                                  {selectedParentId && (
                                      <div className="sticky top-0 z-10 bg-lemon/20 border border-lemon p-2 mb-2 rounded text-xs flex items-center justify-between shadow-sm text-lemon-900">
                                          <span className="font-bold flex items-center gap-2"><CornerDownRight size={12}/> Adding inside container...</span>
                                          <button onClick={() => setSelectedParentId(null)} className="font-bold underline hover:text-black">Go Up to Root</button>
                                      </div>
                                  )}
                                  <div className="max-w-2xl mx-auto space-y-1 pb-20">
                                      {builderLogic.length === 0 ? (
                                          <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                                              <Blocks size={48} className="mb-4 opacity-20"/>
                                              <p>Start building your logic!</p>
                                              <p className="text-xs">Click blocks on the left to add.</p>
                                          </div>
                                      ) : (
                                          builderLogic.map((block, index) => renderBlockInputs(block))
                                      )}
                                  </div>
                              </div>
                          </>
                      )}
                      {/* Vars Tab */}
                      {builderTab === 'vars' && (
                          <div className="p-4 w-full h-full flex flex-col">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-sm">GLOBAL VARIABLES</h3>
                                  <Button size="sm" onClick={() => setBuilderVariables([...builderVariables, { id: `var_${Date.now()}`, name: 'newVar', type: 'string', value: '' }])} className="text-xs">
                                      <PlusSquare size={14} className="mr-1"/> Add Variable
                                  </Button>
                              </div>
                              <div className="flex-1 overflow-y-auto space-y-2">
                                  {builderVariables.map((v, i) => (
                                      <div key={v.id} className="flex items-center gap-2 p-2 border border-gray-200 bg-white">
                                          <input className="border p-1 text-xs w-1/3" value={v.name} onChange={(e) => { const newVars = [...builderVariables]; newVars[i].name = e.target.value; setBuilderVariables(newVars); }} placeholder="Name"/>
                                          <select className="border p-1 text-xs" value={v.type} onChange={(e) => { const newVars = [...builderVariables]; newVars[i].type = e.target.value as any; setBuilderVariables(newVars); }}>
                                              <option value="string">String</option>
                                              <option value="number">Number</option>
                                              <option value="boolean">Boolean</option>
                                              <option value="color">Color</option>
                                          </select>
                                          <input className="border p-1 text-xs flex-1" value={v.value} onChange={(e) => { const newVars = [...builderVariables]; newVars[i].value = e.target.value; setBuilderVariables(newVars); }} placeholder="Default Value"/>
                                          <button onClick={() => setBuilderVariables(builderVariables.filter(bv => bv.id !== v.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                      {builderTab === 'magic' && (
                           <div className="text-center py-10 w-full flex flex-col items-center">
                               <Sparkles className="mb-2 text-lemon-600" size={32}/>
                               <p className="text-xs text-gray-500 mb-4 max-w-md">Describe functionality and AI will generate the logic blocks.</p>
                               <textarea className="w-2/3 border-2 border-gray-200 p-4 text-sm h-48 mb-4 focus:border-lemon outline-none resize-none" placeholder="Describe your extension..." value={builderPrompt} onChange={e => setBuilderPrompt(e.target.value)}></textarea>
                               {isProcessing && <p className="text-xs text-lemon-600 font-bold mb-2 animate-pulse">Consulting the Oracle...</p>}
                               <Button size="md" onClick={runBuilderMagic} disabled={isProcessing}>Generate Extension</Button>
                           </div>
                      )}

                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
                      <Button onClick={handleExportBuilder} className="flex items-center gap-2"><Download size={14}/> Export .lpe</Button>
                  </div>
              </div>
          </DraggableWindow>
      )}

      {showTimeline && (
          <DraggableWindow title="TIMELINE & ANIMATIONS" onClose={() => setShowTimeline(false)} className="w-[300px] h-[450px]" initialPos={{x: 800, y: 100}}>
              {/* ... Timeline Content ... */}
               <div className="p-4 flex flex-col gap-4">
                  {selectedComponentIds.length === 0 ? (
                      <div className="text-center text-gray-400 text-xs py-10">Select an element to animate</div>
                  ) : (
                      <>
                          <div className="bg-gray-100 p-2 rounded mb-2 text-center text-xs font-bold text-gray-500">{selectedComponentIds.length} item(s) selected</div>
                          <div>
                              <label className="text-[10px] font-bold block mb-1">ANIMATION TYPE</label>
                              <select className="w-full border p-1 text-xs bg-white" onChange={(e) => { updateSelectedComponents((prev) => ({ animation: { name: e.target.value, duration: prev.animation?.duration || 1, delay: prev.animation?.delay || 0 } })) }}>
                                  <option value="">None</option>
                                  {ANIMATION_TYPES.map(a => (<option key={a} value={a}>{a}</option>))}
                              </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div><label className="text-[10px] font-bold block mb-1">DURATION (s)</label><input type="number" step="0.1" className="w-full border p-1 text-xs" onChange={(e) => { const val = parseFloat(e.target.value); updateSelectedComponents((prev) => ({ animation: { name: prev.animation?.name || 'fadeIn', duration: val, delay: prev.animation?.delay || 0 } })) }}/></div>
                              <div><label className="text-[10px] font-bold block mb-1">DELAY (s)</label><input type="number" step="0.1" className="w-full border p-1 text-xs" onChange={(e) => { const val = parseFloat(e.target.value); updateSelectedComponents((prev) => ({ animation: { name: prev.animation?.name || 'fadeIn', duration: prev.animation?.duration || 1, delay: val } })) }}/></div>
                          </div>
                          <Button size="sm" onClick={() => setPreviewTrigger(Date.now())} className="mt-2"><PlayCircle size={14} className="mr-1"/> Preview</Button>
                          <Button size="sm" variant="secondary" onClick={() => updateSelectedComponents({ animation: undefined })} className="mt-1 text-xs text-red-500">Remove Animation</Button>
                      </>
                  )}
              </div>
          </DraggableWindow>
      )}

      {showResizeTool && (
           <DraggableWindow title="RESIZE MASTER" onClose={() => setShowResizeTool(false)} className="w-[280px] h-[350px]" initialPos={{x: 800, y: 150}}>
               <div className="p-4 flex flex-col gap-3">
                   {/* ... Resize Tool Content ... */}
                   {selectedComponentIds.length === 0 ? <div className="text-center text-gray-400 text-xs py-10">Select an element</div> : 
                       <>
                           <div className="grid grid-cols-2 gap-3">
                               <div><label className="text-[10px] font-bold block">X (%)</label><input className="border p-1 w-full text-xs font-mono" type="number" onChange={(e) => updateSelectedComponents({ style: { left: `${e.target.value}%` } })}/></div>
                               <div><label className="text-[10px] font-bold block">Y (%)</label><input className="border p-1 w-full text-xs font-mono" type="number" onChange={(e) => updateSelectedComponents({ style: { top: `${e.target.value}%` } })}/></div>
                               <div><label className="text-[10px] font-bold block">WIDTH</label><input className="border p-1 w-full text-xs font-mono" type="text" onChange={(e) => updateSelectedComponents({ style: { width: e.target.value } })}/></div>
                               <div><label className="text-[10px] font-bold block">HEIGHT</label><input className="border p-1 w-full text-xs font-mono" type="text" onChange={(e) => updateSelectedComponents({ style: { height: e.target.value } })}/></div>
                           </div>
                           <div className="border-t border-gray-200 pt-3"><label className="text-[10px] font-bold block mb-1">OPACITY</label><input type="range" min="0" max="1" step="0.1" className="w-full" onChange={(e) => updateSelectedComponents((prev) => ({ effects: { ...prev.effects, opacity: parseFloat(e.target.value) } }))} /></div>
                           <div className="border-t border-gray-200 pt-3"><label className="text-[10px] font-bold block mb-1">ALIGNMENT</label><div className="flex gap-1 justify-between"><button className="p-1 border hover:bg-gray-100" onClick={() => updateSelectedComponents({ style: { textAlign: 'left' } })}><AlignLeft size={14}/></button><button className="p-1 border hover:bg-gray-100" onClick={() => updateSelectedComponents({ style: { textAlign: 'center' } })}><AlignCenter size={14}/></button><button className="p-1 border hover:bg-gray-100" onClick={() => updateSelectedComponents({ style: { textAlign: 'right' } })}><AlignRight size={14}/></button><button className="p-1 border hover:bg-gray-100" onClick={() => updateSelectedComponents({ style: { top: '50%', transform: 'translateY(-50%)' } })}><AlignVerticalJustifyCenter size={14}/></button></div></div>
                       </>
                   }
               </div>
           </DraggableWindow>
      )}

      {showElementPack && (
          <DraggableWindow title="NEO ELEMENTS" onClose={() => setShowElementPack(false)} className="w-[320px] h-[200px]" initialPos={{x: 200, y: 500}}>
              <div className="p-4 grid grid-cols-3 gap-2">
                  <button onClick={() => addComponent('custom', { customType: 'neo-note', content: '<div style="background:#fef08a; width:100%; height:100%; padding:10px; border:2px solid black; font-family:monospace; box-shadow: 4px 4px 0px 0px #000;">NOTE</div>', style: { width: '150px', height: '150px' } })} className="flex flex-col items-center justify-center p-2 border hover:bg-gray-50 text-xs font-bold gap-1" title="Note"><StickyNote size={20} className="text-yellow-500"/> NOTE</button>
                  <button onClick={() => addComponent('custom', { customType: 'neo-badge', content: '<div style="background:black; color:white; padding:5px 10px; border-radius:99px; font-weight:bold; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">BADGE</div>', style: { width: '100px', height: '40px' } })} className="flex flex-col items-center justify-center p-2 border hover:bg-gray-50 text-xs font-bold gap-1" title="Badge"><div className="px-2 py-0.5 bg-black text-white rounded-full text-[8px]">BADGE</div> BADGE</button>
                  <button onClick={() => addComponent('custom', { customType: 'neo-circle', content: '<div style="background:#ef4444; width:100%; height:100%; border-radius:50%; border:2px solid black;"></div>', style: { width: '100px', height: '100px' } })} className="flex flex-col items-center justify-center p-2 border hover:bg-gray-50 text-xs font-bold gap-1" title="Circle"><Circle size={20} className="text-red-500"/> CIRCLE</button>
                  <button onClick={() => addComponent('custom', { customType: 'neo-card', content: '<div style="background:white; width:100%; height:100%; border:2px solid black; box-shadow:4px 4px 0 black; padding:10px;"><h3>Title</h3><p>Content</p></div>', style: { width: '200px', height: '150px' } })} className="flex flex-col items-center justify-center p-2 border hover:bg-gray-50 text-xs font-bold gap-1" title="Card"><CreditCard size={20} className="text-blue-500"/> CARD</button>
                  <button onClick={() => addComponent('custom', { customType: 'neo-divider', content: '<div style="width:100%; height:4px; background:black;"></div>', style: { width: '300px', height: '20px' } })} className="flex flex-col items-center justify-center p-2 border hover:bg-gray-50 text-xs font-bold gap-1" title="Divider"><Minus size={20} /> DIVIDER</button>
              </div>
          </DraggableWindow>
      )}

      {showExtensionWindow && (
            <DraggableWindow title="EXTENSION MANAGER" onClose={() => setShowExtensionWindow(false)} className="w-[600px] h-[500px]" initialPos={{x: 80, y: 100}}>
                  {/* ... Extension Manager Content ... */}
                  <div className="flex flex-col h-full">
                      <div className="p-4 border-b-2 border-obsidian bg-gray-50 shrink-0">
                          <div className="flex gap-4">
                              <button onClick={() => setExtensionTab('installed')} className={`flex items-center gap-2 px-4 py-2 font-bold text-sm border-b-2 transition-colors ${extensionTab === 'installed' ? 'border-obsidian text-obsidian' : 'border-transparent text-gray-400 hover:text-obsidian'}`}><Blocks size={16}/> Installed</button>
                              <button onClick={() => setExtensionTab('shop')} className={`flex items-center gap-2 px-4 py-2 font-bold text-sm border-b-2 transition-colors ${extensionTab === 'shop' ? 'border-obsidian text-obsidian' : 'border-transparent text-gray-400 hover:text-obsidian'}`}><ShoppingBag size={16}/> Marketplace</button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                          {extensionTab === 'installed' ? (
                              <>
                                  <div className="mb-4 p-3 bg-gray-50 border border-dashed border-gray-300 rounded text-center">
                                      <h3 className="font-bold text-xs mb-1">Manual Installation</h3>
                                      <Button onClick={() => lpeInputRef.current?.click()} size="sm" className="flex items-center gap-2 mx-auto text-[10px] py-1"><Upload size={12}/> Upload .lpe</Button>
                                  </div>
                                  <div className="space-y-2">
                                      {plugins.length === 0 ? <div className="text-center text-gray-400 text-xs py-10">No extensions installed. Visit the Marketplace!</div> : 
                                          plugins.map(plugin => (
                                              <div key={plugin.id} className="flex items-center justify-between p-2 border border-gray-200 bg-white hover:border-obsidian transition-colors">
                                                  <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => handleRunPlugin(plugin)}>
                                                      <div className="w-8 h-8 bg-lemon/20 flex items-center justify-center rounded"><Blocks size={16} className="text-obsidian"/></div>
                                                      <div><h4 className="font-bold text-xs">{plugin.name} <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">v{plugin.version}</span></h4><p className="text-[10px] text-gray-500 truncate max-w-[250px]">{plugin.description}</p></div>
                                                  </div>
                                                  <div className="flex gap-2 items-center"><Button size="sm" className="!py-0.5 !px-2 text-[10px]" onClick={() => handleRunPlugin(plugin)}>Run</Button><button onClick={() => removePlugin(plugin.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={14}/></button></div>
                                              </div>
                                          ))
                                      }
                                  </div>
                              </>
                          ) : (
                              <>
                                   <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-xs">Global Marketplace</h3><Button onClick={() => lpePublishRef.current?.click()} size="sm" variant="secondary" className="text-[10px] py-1 flex items-center gap-1"><Store size={12}/> Publish</Button></div>
                                   <div className="grid grid-cols-1 gap-3">
                                       {shopPlugins.length === 0 ? <div className="col-span-full text-center text-gray-400 text-xs py-10">Loading marketplace...</div> : 
                                           shopPlugins.map(plugin => {
                                               const isInstalled = plugins.some(p => p.id === plugin.id);
                                               return (
                                                   <div key={plugin.id} className="border border-gray-200 p-3 hover:border-obsidian transition-colors bg-white">
                                                       <div className="flex justify-between items-start mb-1">
                                                           <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-100 flex items-center justify-center rounded"><Blocks size={12} className="text-gray-500"/></div><div><h4 className="font-bold text-xs">{plugin.name}</h4><div className="text-[10px] text-gray-400">by {plugin.author}</div></div></div>
                                                           {isInstalled ? <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1 rounded">INSTALLED</span> : <span className="text-[8px] font-bold text-lemon-600 bg-lemon/10 px-1 rounded">FREE</span>}
                                                       </div>
                                                       <p className="text-[10px] text-gray-500 mb-2 h-6 overflow-hidden leading-tight">{plugin.description}</p>
                                                       <Button onClick={() => installFromShop(plugin)} size="sm" disabled={isInstalled} className="w-full text-[10px] py-1">{isInstalled ? 'Installed' : 'Install'}</Button>
                                                   </div>
                                               )
                                           })
                                       }
                                   </div>
                              </>
                          )}
                      </div>
                  </div>
            </DraggableWindow>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" ref={lpeInputRef} onChange={handleLoadLPE} className="hidden" />
      <input type="file" ref={lpePublishRef} onChange={handlePublishExtension} className="hidden" />
    </div>
  );
};

export default App;