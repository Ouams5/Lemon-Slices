import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_PRESENTATION, BLANK_PRESENTATION, MAGIC_OPTIONS, TEMPLATES, BUILDER_BLOCKS, CATEGORY_COLORS } from './constants';
import { SlideCanvas } from './components/SlideCanvas';
import { Toolbar } from './components/Toolbar';
import { Button } from './components/Button';
import { DraggableWindow } from './components/DraggableWindow';
import { PresentationData, User, SlideComponent, PluginDefinition, LogicBlock, PluginVariable } from './types';
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
    FirebaseUser 
} from './services/firebase';
import { 
    ArrowRight, User as UserIcon, X, Play, 
    PlusSquare, LayoutGrid, LogOut, Download, Sparkles, ChevronLeft, ChevronRight, Globe, Loader2, Mail, Lock, FileOutput,
    Type, Palette, PaintBucket, Minimize2, Image as ImageIcon, Upload, Link, FolderOpen, Blocks, Trash2, 
    Group, Ungroup, BoxSelect, Sun, Eye, ShoppingBag, Store, Maximize, Shapes, Circle, Sticker, StickyNote, CreditCard, Minus, 
    Film, Cpu, PlayCircle, Settings, Variable, Database, CornerDownRight
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
    }
];

const ANIMATION_TYPES = [
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

  // --- Manual Editor Actions ---

  const addComponent = (type: string, pluginId?: string) => {
      let newComp: SlideComponent = {
          id: `c_${Date.now()}`,
          type: type as SlideComponent['type'],
          content: '',
          style: { top: '30%', left: '30%', position: 'absolute' },
          fontFamily: 'sans'
      };

      if (type === 'plugin' && pluginId) {
          const plugin = plugins.find(p => p.id === pluginId);
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

  const handleRunPlugin = (plugin: PluginDefinition) => {
      if (plugin.id === 'ext_resize_master') setShowResizeTool(true);
      else if (plugin.id === 'ext_element_pack') setShowElementPack(true);
      else if (plugin.id === 'ext_better_animations') setShowTimeline(true);
      else if (plugin.id === 'ext_builder') setShowBuilder(true);
      else addComponent('plugin', plugin.id);
      setShowExtensionWindow(false);
  };

  // --- Logic Engine for Extensions ---
  const executePluginLogic = async (plugin: PluginDefinition) => {
      // Create a sandbox execution environment context
      const context = {
          variables: {} as Record<string, any>,
          lastCreatedId: null as string | null,
          stopExecution: false
      };

      // Initialize variables
      if (plugin.variables) {
          plugin.variables.forEach(v => context.variables[v.name] = v.value);
      }

      // Helper to evaluate simple conditions
      const evaluateCondition = (condition: string): boolean => {
         // Simple parser: currently just checks "true", "false", or variable truthiness
         if (condition === 'true') return true;
         if (condition === 'false') return false;
         // Check if it's a variable
         if (context.variables.hasOwnProperty(condition)) {
             return !!context.variables[condition];
         }
         return true; // default
      };

      // Helper to execute a single block
      const executeBlock = async (block: LogicBlock) => {
          if (context.stopExecution) return;
          const { type, params, children } = block;
          
          if (type === 'create_text') {
              const comp: SlideComponent = {
                  id: `gen_${Date.now()}_${Math.random()}`,
                  type: 'text',
                  content: params.content,
                  style: { position: 'absolute', left: `${params.x}%`, top: `${params.y}%`, color: params.color, width: 'auto' },
                  fontFamily: params.font
              };
              data.slides[currentSlideIndex].components.push(comp);
              context.lastCreatedId = comp.id;
          }
          else if (type === 'create_shape') {
              const comp: SlideComponent = {
                  id: `gen_${Date.now()}_${Math.random()}`,
                  type: 'custom',
                  content: `<div style="width:100%;height:100%;background:${params.color};border-radius:${params.shape === 'circle' ? '50%' : '0'}"></div>`,
                  style: { position: 'absolute', left: `${params.x}%`, top: `${params.y}%`, width: `${params.size}px`, height: `${params.size}px` }
              };
              data.slides[currentSlideIndex].components.push(comp);
              context.lastCreatedId = comp.id;
          }
          else if (type === 'style_color') {
              const targetId = params.target === 'last_created' ? context.lastCreatedId : params.target;
              if (targetId) {
                  const comp = data.slides[currentSlideIndex].components.find(c => c.id === targetId);
                  if (comp) comp.style = { ...comp.style, color: params.color };
              }
          }
          else if (type === 'sys_alert') {
              alert(params.message);
          }
          else if (type === 'flow_repeat') {
              const times = parseInt(params.times) || 1;
              for (let i = 0; i < times; i++) {
                  if (children) {
                      for (const child of children) {
                          await executeBlock(child);
                      }
                  }
              }
          }
          else if (type === 'flow_if') {
              if (evaluateCondition(params.condition)) {
                  if (children) {
                      for (const child of children) {
                          await executeBlock(child);
                      }
                  }
              }
          }
          else if (type === 'sys_wait') {
               await new Promise(r => setTimeout(r, params.time));
          }
      };

      // Run main logic
      if (plugin.logic) {
          for (const block of plugin.logic) {
              await executeBlock(block);
          }
          setData({...data}); // Trigger re-render after modifications
      }
  };

  // ... helper functions for updateComponent, etc. ...
  const updateComponent = (id: string, updates: Partial<SlideComponent>) => {
      const newSlides = [...data.slides];
      const slide = newSlides[currentSlideIndex];
      const compIndex = slide.components.findIndex(c => c.id === id);
      if (compIndex >= 0) {
          slide.components[compIndex] = { ...slide.components[compIndex], ...updates };
          setData({ ...data, slides: newSlides });
      }
  };

  const updateSelectedComponents = (updates: Partial<SlideComponent> | ((prev: SlideComponent) => Partial<SlideComponent>)) => {
      const newSlides = [...data.slides];
      const slide = newSlides[currentSlideIndex];
      selectedComponentIds.forEach(id => {
          const compIndex = slide.components.findIndex(c => c.id === id);
          if (compIndex >= 0) {
              const currentComp = slide.components[compIndex];
              const resolvedUpdates = typeof updates === 'function' ? updates(currentComp) : updates;
              let finalUpdates = {...resolvedUpdates};
              if (resolvedUpdates.effects && currentComp.effects) {
                 finalUpdates.effects = { ...currentComp.effects, ...resolvedUpdates.effects };
              }
              slide.components[compIndex] = { ...currentComp, ...finalUpdates };
          }
      });
      setData({ ...data, slides: newSlides });
  }
  
  const deleteComponent = (id: string) => {
      const newSlides = [...data.slides];
      newSlides[currentSlideIndex].components = newSlides[currentSlideIndex].components.filter(c => c.id !== id);
      setData({ ...data, slides: newSlides });
      setSelectedComponentIds(ids => ids.filter(sid => sid !== id));
  };
  
  const handleDeleteSelected = () => {
      const newSlides = [...data.slides];
      newSlides[currentSlideIndex].components = newSlides[currentSlideIndex].components.filter(c => !selectedComponentIds.includes(c.id));
      setData({ ...data, slides: newSlides });
      setSelectedComponentIds([]);
  }

  // --- Extension Builder Logic ---
  
  const addBuilderBlock = (type: string, defParams: any) => {
      const newBlock: LogicBlock = {
          id: `blk_${Date.now()}_${Math.random()}`,
          type,
          params: defParams.reduce((acc: any, p: any) => ({...acc, [p.name]: p.default}), {}),
          children: []
      };

      if (selectedParentId) {
          // Add to nested children
          const addToParent = (blocks: LogicBlock[]): LogicBlock[] => {
              return blocks.map(b => {
                  if (b.id === selectedParentId) {
                      return { ...b, children: [...(b.children || []), newBlock] };
                  }
                  if (b.children) {
                      return { ...b, children: addToParent(b.children) };
                  }
                  return b;
              });
          };
          setBuilderLogic(addToParent(builderLogic));
      } else {
          // Add to root
          setBuilderLogic([...builderLogic, newBlock]);
      }
  };

  const updateBuilderBlock = (id: string, paramName: string, value: any) => {
      const updateRecursive = (blocks: LogicBlock[]): LogicBlock[] => {
          return blocks.map(b => {
              if (b.id === id) return { ...b, params: { ...b.params, [paramName]: value } };
              if (b.children) return { ...b, children: updateRecursive(b.children) };
              return b;
          });
      };
      setBuilderLogic(updateRecursive(builderLogic));
  };

  const removeBuilderBlock = (id: string) => {
      const removeRecursive = (blocks: LogicBlock[]): LogicBlock[] => {
          return blocks.filter(b => b.id !== id).map(b => {
              if (b.children) return { ...b, children: removeRecursive(b.children) };
              return b;
          });
      };
      setBuilderLogic(removeRecursive(builderLogic));
  };

  const handleExportBuilder = () => {
      const finalPlugin = {
          ...builderData,
          logic: builderLogic,
          variables: builderVariables,
          payload: { type: 'custom' as const } // Dummy payload
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalPlugin, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${builderData.name.replace(/\s+/g, '_')}.lpe`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  }

  const runBuilderMagic = async () => {
      if (!builderPrompt) return;
      setIsProcessing(true);
      const result = await runExtensionBuilder(builderPrompt);
      if (result) {
          setBuilderData(prev => ({
              ...prev,
              name: result.name || prev.name,
              description: result.description || prev.description,
              version: result.version || prev.version,
              author: result.author || prev.author
          }));
          if (result.logic) setBuilderLogic(result.logic);
          if (result.variables) setBuilderVariables(result.variables);
          setBuilderTab('logic');
      }
      setIsProcessing(false);
  }

  const runMagic = async () => {
      if (!magicPrompt) return;
      setIsProcessing(true);
      setMagicStatus('Consulting the AI Oracle...');
      setMagicResult(null);

      try {
          if (magicMode === 'deck') {
              const newDeckData = await runDraftToDeck(magicPrompt);
              if (newDeckData && newDeckData.slides && newDeckData.slides.length > 0) {
                  // Ensure IDs are unique
                  const processedSlides = newDeckData.slides.map((s: any, idx: number) => ({
                      ...s,
                      id: `slide_${Date.now()}_${idx}`,
                      slide_number: idx + 1,
                      components: s.components.map((c: any, cIdx: number) => ({
                          ...c,
                          id: `comp_${Date.now()}_${idx}_${cIdx}`,
                          style: typeof c.style === 'string' ? JSON.parse(c.style) : c.style
                      }))
                  }));

                  // 2. Generate Images for placeholders - FIX: Actually await generation
                  for (let i = 0; i < processedSlides.length; i++) {
                      const slide = processedSlides[i];
                      for (let j = 0; j < slide.components.length; j++) {
                          const comp = slide.components[j];
                          if (comp.type === 'image' && comp.image_prompt) {
                              setMagicStatus(`Painting slide ${i+1}/${processedSlides.length}...`);
                              try {
                                  const url = await runAetherPaint(comp.image_prompt);
                                  comp.src = url;
                              } catch (err) {
                                  console.error("Failed to paint image", err);
                              }
                          }
                      }
                  }

                  const fullDeck: PresentationData = {
                      ...BLANK_PRESENTATION,
                      ...newDeckData,
                      slides: processedSlides,
                      id: `deck_${Date.now()}`,
                      uid: currentUser?.uid,
                      created_at: new Date().toISOString()
                  };
                  setData(fullDeck);
                  setCurrentSlideIndex(0);
                  setMagicMode(null);
                  setMagicPrompt('');
              } else {
                  setMagicResult("Failed to generate deck. Please try again.");
              }
          } 
          else if (magicMode === 'image') {
              const imageUrl = await runAetherPaint(magicPrompt);
              if (imageUrl) {
                  const newComp: SlideComponent = {
                      id: `img_${Date.now()}`,
                      type: 'image',
                      src: imageUrl,
                      content: 'AI Generated Image',
                      style: { top: '20%', left: '20%', width: '400px', height: '300px', position: 'absolute' }
                  };
                  const newSlides = [...data.slides];
                  newSlides[currentSlideIndex].components.push(newComp);
                  setData({ ...data, slides: newSlides });
                  setMagicMode(null);
                  setMagicPrompt('');
              } else {
                   setMagicResult("Failed to generate image.");
              }
          }
          else if (magicMode === 'text') {
              const rewritten = await runToneShifter(magicPrompt, 'persuasive');
              if (rewritten) {
                  const newComp: SlideComponent = {
                      id: `txt_${Date.now()}`,
                      type: 'text',
                      content: rewritten,
                      style: { top: '30%', left: '30%', width: '400px', position: 'absolute' },
                      fontFamily: 'sans'
                  };
                  const newSlides = [...data.slides];
                  newSlides[currentSlideIndex].components.push(newComp);
                  setData({ ...data, slides: newSlides });
                  setMagicMode(null);
                  setMagicPrompt('');
              } else {
                   setMagicResult("Failed to rewrite text.");
              }
          }
      } catch (e) {
          console.error(e);
          setMagicResult("An error occurred during generation.");
      } finally {
          setIsProcessing(false);
          setMagicStatus('');
      }
  };

  // Helper to render inputs for blocks
  const renderBlockInputs = (block: LogicBlock, depth = 0) => {
      // Find definition
      let def: any = null;
      let category = 'components';
      Object.entries(BUILDER_BLOCKS).forEach(([cat, blocks]) => {
          const found = blocks.find((b: any) => b.type === block.type);
          if (found) {
              def = found;
              category = cat;
          }
      });

      if (!def) return <div className="text-red-500 text-[10px]">Unknown Block</div>;

      const colorClass = CATEGORY_COLORS[category] || 'bg-gray-500 text-white';
      const isContainer = def.container;
      const isActiveParent = selectedParentId === block.id;

      return (
          <div className="mb-1 transition-all duration-200">
              <div 
                  className={`p-2 rounded-lg shadow-sm border-l-8 flex flex-col gap-1 select-none relative ${colorClass} 
                    ${isActiveParent ? 'ring-2 ring-lemon border-white' : ''} hover:brightness-110 cursor-pointer`}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (isContainer) {
                          setSelectedParentId(selectedParentId === block.id ? null : block.id);
                      }
                  }}
              >
                  <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase flex items-center gap-2">
                          {def.label}
                      </span>
                      <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); removeBuilderBlock(block.id); }} className="hover:text-red-200"><Trash2 size={12}/></button>
                      </div>
                  </div>
                  
                  {/* Inputs */}
                  <div className="grid grid-cols-2 gap-1 mt-1">
                      {def.params.map((p: any) => (
                          <div key={p.name} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <label className="text-[8px] font-bold opacity-70 uppercase w-12 truncate">{p.name}</label>
                              {p.type === 'select' ? (
                                  <select 
                                    className="text-black text-[10px] p-0.5 rounded flex-1 h-5 outline-none"
                                    value={block.params[p.name]}
                                    onChange={(e) => updateBuilderBlock(block.id, p.name, e.target.value)}
                                  >
                                      {p.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                  </select>
                              ) : p.type === 'color' ? (
                                  <input type="color" value={block.params[p.name]} onChange={(e) => updateBuilderBlock(block.id, p.name, e.target.value)} className="w-4 h-4 border-0 p-0 rounded-full overflow-hidden cursor-pointer"/>
                              ) : (
                                  <input 
                                    type={p.type === 'number' ? 'number' : 'text'}
                                    className="text-black text-[10px] p-0.5 rounded flex-1 h-5 w-full min-w-0 outline-none"
                                    value={block.params[p.name]}
                                    onChange={(e) => updateBuilderBlock(block.id, p.name, p.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                  />
                              )}
                          </div>
                      ))}
                  </div>
              </div>
              
              {/* Nested Children */}
              {isContainer && (
                  <div className={`ml-3 pl-2 border-l-4 min-h-[30px] mt-1 rounded-bl-lg rounded-tl-sm py-2 pr-1 transition-all ${isActiveParent ? 'border-lemon bg-lemon/5' : 'border-gray-300 bg-gray-50'}`}>
                      {block.children && block.children.length > 0 ? (
                          block.children.map((child, i) => (
                              <div key={child.id}>{renderBlockInputs(child, depth + 1)}</div>
                          ))
                      ) : (
                          <div className={`text-[9px] italic pl-2 py-1 ${isActiveParent ? 'text-lemon-700 font-bold' : 'text-gray-400'}`}>
                              {isActiveParent ? 'Select blocks to add here...' : 'Empty (Click to add)'}
                          </div>
                      )}
                  </div>
              )}
          </div>
      )
  };

  const renderHeader = () => {
      if (view === 'auth') return null;

      return (
          <div className="flex items-center gap-3">
              {view === 'dashboard' && (
                  <>
                      <div className="hidden md:flex flex-col items-end mr-2">
                          <span className="text-xs font-bold">{currentUser?.displayName || 'Guest'}</span>
                          <span className="text-[10px] text-gray-500">{currentUser?.email}</span>
                      </div>
                      <Button size="sm" onClick={handleLogout} variant="secondary" className="border-gray-300">
                          <LogOut size={14} className="md:mr-1"/> <span className="hidden md:inline">Logout</span>
                      </Button>
                  </>
              )}

              {view === 'editor' && (
                  <>
                       {/* RESTORED MAGIC TOOLBAR */}
                       <div className="flex items-center justify-center gap-1 md:gap-2 bg-gray-50 border border-gray-200 p-1 rounded-full px-2 md:px-4 mr-2">
                           <span className="text-xs font-bold text-gray-400 mr-2 hidden md:inline">MAGIC:</span>
                           {MAGIC_OPTIONS.map(opt => (
                               <button 
                                  key={opt.id}
                                  onClick={() => { setMagicMode(opt.id.split('-')[1] as MagicMode); setMagicPrompt(''); setMagicResult(null); }}
                                  className="p-1.5 md:p-2 hover:bg-lemon hover:text-obsidian rounded-full transition-colors text-gray-500"
                                  title={opt.label}
                               >
                                   <opt.icon size={16} />
                               </button>
                           ))}
                       </div>
                       
                       <div className="w-px h-6 bg-gray-300 mx-1 hidden md:block"></div>

                       <button onClick={handleSaveLPF} className="p-2 text-gray-500 hover:text-obsidian transition-colors" title="Save LPF">
                           <Download size={18}/>
                       </button>

                       <button onClick={handleExportPPTX} className="p-2 text-gray-500 hover:text-obsidian transition-colors" title="Export PPTX">
                           <FileOutput size={18}/>
                       </button>

                       <Button size="sm" onClick={() => setView('present')} className="ml-2 flex items-center gap-2">
                           <Play size={14} fill="currentColor"/> <span className="hidden md:inline">Present</span>
                       </Button>

                       <div className="ml-2 pl-2 border-l border-gray-300 flex items-center">
                           <button onClick={handleSaveAndExit} className="p-2 text-gray-500 hover:text-red-500" title="Exit to Dashboard">
                               <LogOut size={18}/>
                           </button>
                       </div>
                  </>
              )}

              {view === 'present' && (
                  <Button size="sm" variant="secondary" onClick={() => setView('editor')}>
                      Exit Presentation
                  </Button>
              )}
          </div>
      );
  };

  if (view === 'present') {
      return (
          <div className="h-screen w-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
             <div key={currentSlideIndex} className={`w-full max-w-7xl aspect-video relative p-20 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.1)] animate-${currentSlide.transition || 'fade'}`} style={{ backgroundColor: currentSlide.backgroundColor || '#ffffff', color: (currentSlide.backgroundColor === '#000000' || currentSlide.backgroundColor === '#000') ? 'white' : 'black' }}>
                 <h1 className={`text-4xl md:text-7xl font-bold mb-8 text-center font-${currentSlide.baseFont || 'display'}`}>{currentSlide.title}</h1>
                 <div className="relative w-full h-full">
                     <SlideCanvas slide={currentSlide} selectedIds={[]} onSelect={() => {}} onMultiSelect={() => {}} onUpdateComponent={() => {}} onDeleteComponent={() => {}} onUpdateMultiple={() => {}} previewTrigger={Date.now()} />
                 </div>
             </div>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 p-2 rounded-full border border-gray-700 backdrop-blur-sm opacity-50 hover:opacity-100 transition-opacity z-50">
                 <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} className="p-2 text-white hover:text-lemon"><ChevronLeft /></button>
                 <span className="font-mono text-sm">{currentSlideIndex + 1} / {data.slides.length}</span>
                 <button onClick={() => setCurrentSlideIndex(Math.min(data.slides.length-1, currentSlideIndex + 1))} className="p-2 text-white hover:text-lemon"><ChevronRight /></button>
                 <div className="w-px h-4 bg-gray-600 mx-2"></div>
                 <button onClick={() => setView('editor')} className="p-2 text-white hover:text-red-500 font-bold text-xs">EXIT</button>
             </div>
          </div>
      )
  }

  // --- Default Editor View ---
  return (
    <div className="h-screen w-screen flex flex-col bg-paper text-obsidian overflow-hidden select-none">
      
      {/* Magic Modal */}
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

      {/* Extension Builder Window - UPDATED UI */}
      {showBuilder && (
          <DraggableWindow title="EXTENSION BUILDER" onClose={() => setShowBuilder(false)} className="w-[900px] h-[650px]" initialPos={{x: 50, y: 50}}>
              <div className="flex flex-col h-full bg-white">
                  <div className="flex border-b border-obsidian shrink-0">
                      <button onClick={() => setBuilderTab('meta')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'meta' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Metadata</button>
                      <button onClick={() => setBuilderTab('logic')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'logic' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Visual Scripting</button>
                      <button onClick={() => setBuilderTab('vars')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'vars' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Variables</button>
                      <button onClick={() => setBuilderTab('magic')} className={`px-4 py-2 text-xs font-bold uppercase ${builderTab === 'magic' ? 'bg-lemon text-obsidian' : 'bg-gray-50 text-gray-500'}`}>Magic Gen</button>
                  </div>

                  <div className="flex-1 overflow-hidden flex">
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

                      {builderTab === 'logic' && (
                          <>
                              {/* Sidebar: Block Palette */}
                              <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 overflow-y-auto custom-scrollbar shrink-0">
                                  {Object.entries(BUILDER_BLOCKS).map(([category, blocks]) => (
                                      <div key={category} className="mb-2">
                                          <div className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase bg-gray-100 sticky top-0 border-b border-gray-200">{category}</div>
                                          <div className="p-2 space-y-2">
                                              {blocks.map((b: any) => (
                                                  <div 
                                                    key={b.type} 
                                                    onClick={() => addBuilderBlock(b.type, b.params)}
                                                    className={`p-2 rounded text-xs cursor-pointer shadow-sm active:scale-95 select-none transition-transform font-bold border-b-2
                                                        ${CATEGORY_COLORS[category]}
                                                    `}
                                                  >
                                                      {b.label}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              
                              {/* Main: Logic Stack */}
                              <div className="flex-1 bg-ui p-4 overflow-y-auto custom-scrollbar relative">
                                  {/* Breadcrumbs for nested editing */}
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

                      {/* ... other tabs ... */}
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
                                          <input className="border p-1 text-xs w-1/3" value={v.name} onChange={(e) => {
                                              const newVars = [...builderVariables];
                                              newVars[i].name = e.target.value;
                                              setBuilderVariables(newVars);
                                          }} placeholder="Name"/>
                                          <select className="border p-1 text-xs" value={v.type} onChange={(e) => {
                                              const newVars = [...builderVariables];
                                              newVars[i].type = e.target.value as any;
                                              setBuilderVariables(newVars);
                                          }}>
                                              <option value="string">String</option>
                                              <option value="number">Number</option>
                                              <option value="boolean">Boolean</option>
                                              <option value="color">Color</option>
                                          </select>
                                          <input className="border p-1 text-xs flex-1" value={v.value} onChange={(e) => {
                                              const newVars = [...builderVariables];
                                              newVars[i].value = e.target.value;
                                              setBuilderVariables(newVars);
                                          }} placeholder="Default Value"/>
                                          <button onClick={() => setBuilderVariables(builderVariables.filter(bv => bv.id !== v.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {builderTab === 'magic' && (
                           <div className="text-center py-10 w-full flex flex-col items-center">
                               <Sparkles className="mb-2 text-lemon-600" size={32}/>
                               <p className="text-xs text-gray-500 mb-4 max-w-md">Describe functionality (e.g., "Create a red circle that turns blue when clicked") and AI will generate the logic blocks.</p>
                               <textarea 
                                  className="w-2/3 border-2 border-gray-200 p-4 text-sm h-48 mb-4 focus:border-lemon outline-none resize-none" 
                                  placeholder="Describe your extension..."
                                  value={builderPrompt}
                                  onChange={e => setBuilderPrompt(e.target.value)}
                               ></textarea>
                               {isProcessing && <p className="text-xs text-lemon-600 font-bold mb-2 animate-pulse">Consulting the Oracle...</p>}
                               <Button size="md" onClick={runBuilderMagic} disabled={isProcessing}>Generate Extension</Button>
                           </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
                      <Button onClick={handleExportBuilder} className="flex items-center gap-2">
                          <Download size={14}/> Export .lpe
                      </Button>
                  </div>
              </div>
          </DraggableWindow>
      )}
      
      <header className="h-16 border-b-2 border-obsidian flex items-center justify-between px-4 md:px-6 z-30 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 shrink-0" onClick={handleSaveAndExit}>
            <div className="bg-obsidian text-white p-1 rounded-sm"><LayoutGrid size={16}/></div>
            <span className="font-display font-bold text-xl tracking-wider hidden md:block">LEMON <span className="text-black bg-lemon px-1">SLICES</span></span>
          </div>
          {selectedComponentIds.length === 0 && (
            <>
                <div className="h-6 w-0.5 bg-gray-300 hidden md:block"></div>
                <input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} className="text-sm font-bold text-gray-500 uppercase bg-transparent border-b border-transparent focus:border-lemon focus:outline-none hover:border-gray-300 min-w-0 w-full md:w-auto" />
            </>
          )}
        </div>
        {renderHeader()}
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <Toolbar onAddComponent={(type) => addComponent(type)} onOpenExtensions={() => setShowExtensionWindow(!showExtensionWindow)} plugins={plugins} />

        <div className="hidden md:flex w-60 border-r-2 border-obsidian flex-col bg-ui overflow-y-auto overflow-x-hidden custom-scrollbar shrink-0">
           {data.slides.map((slide, idx) => (
             <div key={slide.id} onClick={() => { setCurrentSlideIndex(idx); setSelectedComponentIds([]); }} className={`p-4 border-b-2 border-gray-200 cursor-pointer transition-all relative group ${idx === currentSlideIndex ? 'bg-white border-l-[6px] border-l-lemon' : 'hover:bg-white border-l-[6px] border-l-transparent'}`}>
                <div className="flex justify-between items-center mb-2"><span className="font-mono text-xs font-bold text-gray-400 group-hover:text-obsidian">0{slide.slide_number}</span>{idx === currentSlideIndex && <div className="w-2 h-2 bg-lemon border border-obsidian rounded-full"></div>}</div>
                <div className={`aspect-video border-2 ${idx === currentSlideIndex ? 'border-obsidian shadow-hard' : 'border-gray-300'} mb-2 p-1 overflow-hidden transition-all pointer-events-none`} style={{ backgroundColor: slide.backgroundColor || '#fff' }}><div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 text-center leading-none select-none">{slide.title}</div></div>
                <p className="text-xs font-bold truncate text-obsidian">{slide.title}</p>
             </div>
           ))}
           <div className="p-4 text-center">
               <button onClick={() => { const newSlide = { slide_number: data.slides.length + 1, id: `s_${Date.now()}`, title: 'New Slide', components: [], animations: [], duration_seconds: 10, backgroundColor: '#ffffff' }; setData({...data, slides: [...data.slides, newSlide]}); }} className="w-full py-3 border-2 border-dashed border-gray-300 rounded hover:border-obsidian hover:bg-lemon/20 text-xs font-bold uppercase transition-all">+ Add Slide</button>
           </div>
        </div>

        <div className="flex-1 bg-ui relative overflow-hidden flex items-center justify-center p-4 md:p-12 mb-16 md:mb-0">
            <SlideCanvas slide={currentSlide} selectedIds={selectedComponentIds} onSelect={(id) => { if (id === null) setSelectedComponentIds([]); else setSelectedComponentIds([id]); }} onMultiSelect={(ids) => setSelectedComponentIds(ids)} onUpdateComponent={updateComponent} onDeleteComponent={deleteComponent} onUpdateMultiple={updateSelectedComponents} previewTrigger={previewTrigger} />
        </div>
      </div>

      {showExtensionWindow && (
            <DraggableWindow title="EXTENSION MANAGER" onClose={() => setShowExtensionWindow(false)} className="w-[600px] h-[500px]" initialPos={{x: 80, y: 100}}>
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