
import { PresentationData, ToolName } from './types';
import { 
  Type, Image as ImageIcon, BarChart3, Vote, 
  Wand2, Sparkles, FileText, Layout
} from 'lucide-react';

// Tools that appear in the Sidebar (Manual Editing)
export const MANUAL_TOOLS = [
  { id: 'add-text', label: 'Text Box', icon: Type, description: 'Add a new text block.' },
  { id: 'add-image', label: 'Image', icon: ImageIcon, description: 'Add an image placeholder.' },
  { id: 'add-chart', label: 'Chart', icon: BarChart3, description: 'Add a 3D Data Viz.' },
  { id: 'add-poll', label: 'Poll', icon: Vote, description: 'Add a live audience poll.' },
];

// Options that appear in the "Magic" Menu
export const MAGIC_OPTIONS = [
  { id: 'magic-deck', label: 'Generate Deck', icon: FileText, description: 'Create a full deck from a prompt.' },
  { id: 'magic-image', label: 'Generate Image', icon: Sparkles, description: 'Create an image using Aether-Paint.' },
  { id: 'magic-text', label: 'Rewrite Text', icon: Wand2, description: 'Polish text with Tone-Shifter.' },
];

export const CATEGORY_COLORS: Record<string, string> = {
    components: 'bg-blue-600 border-blue-800 text-white',
    styling: 'bg-purple-600 border-purple-800 text-white',
    data: 'bg-orange-500 border-orange-700 text-white',
    logic: 'bg-yellow-500 border-yellow-600 text-black'
};

export const CHART_ANIMATIONS = [
    'chartGrowUp',    // The requested Tween 0->Value
    'chartElastic',   // Bouncy growth
    'chartStagger',   // One by one
    'chartWave',      // Sine wave appearance
    'chartDrop',      // Fall from top
    'chartCenter',    // Expand from middle
    'chartWipe',      // Left to right reveal
    'chartPop'        // Scale up with overshoot
];

// --- EXTENSION BUILDER BLOCKS ---
// Added 'container: true' for blocks that can hold other blocks
export const BUILDER_BLOCKS = {
    components: [
        { type: 'create_text', label: 'Create Text', params: [ {name: 'content', type: 'text', default: 'Hello'}, {name: 'x', type: 'number', default: 10}, {name: 'y', type: 'number', default: 10}, {name: 'color', type: 'color', default: '#000000'}, {name: 'font', type: 'select', options: ['sans', 'serif', 'mono', 'display'], default: 'sans'} ] },
        { type: 'create_image', label: 'Create Image', params: [ {name: 'src', type: 'text', default: 'https://'}, {name: 'x', type: 'number', default: 20}, {name: 'y', type: 'number', default: 20}, {name: 'width', type: 'number', default: 300}, {name: 'height', type: 'number', default: 200} ] },
        { type: 'create_shape', label: 'Create Shape', params: [ {name: 'shape', type: 'select', options: ['rect', 'circle'], default: 'rect'}, {name: 'color', type: 'color', default: '#DFFF00'}, {name: 'x', type: 'number', default: 30}, {name: 'y', type: 'number', default: 30}, {name: 'size', type: 'number', default: 100} ] },
        { type: 'create_button', label: 'Create Button', params: [ {name: 'label', type: 'text', default: 'Click Me'}, {name: 'action', type: 'text', default: ''}, {name: 'color', type: 'color', default: '#000000'}, {name: 'textColor', type: 'color', default: '#ffffff'} ] },
        { type: 'create_input', label: 'Create Input', params: [ {name: 'placeholder', type: 'text', default: 'Enter text...'}, {name: 'variable', type: 'text', default: 'input_val'} ] },
        { type: 'create_chart', label: 'Create Chart', params: [ {name: 'title', type: 'text', default: 'Sales'}, {name: 'type', type: 'select', options: ['bar', 'line', 'pie'], default: 'bar'} ] },
        { type: 'create_poll', label: 'Create Poll', params: [ {name: 'question', type: 'text', default: 'Vote now'}, {name: 'option1', type: 'text', default: 'Yes'}, {name: 'option2', type: 'text', default: 'No'} ] },
        { type: 'create_video', label: 'Create Video', params: [ {name: 'url', type: 'text', default: ''}, {name: 'autoplay', type: 'boolean', default: false} ] },
        { type: 'create_icon', label: 'Create Icon', params: [ {name: 'iconName', type: 'text', default: 'Star'}, {name: 'color', type: 'color', default: '#000000'}, {name: 'size', type: 'number', default: 24} ] },
        { type: 'create_webview', label: 'Create WebView', params: [ {name: 'url', type: 'text', default: 'https://google.com'}, {name: 'width', type: 'number', default: 500}, {name: 'height', type: 'number', default: 400} ] },
        { type: 'create_divider', label: 'Create Divider', params: [ {name: 'style', type: 'select', options: ['solid', 'dashed', 'dotted'], default: 'solid'}, {name: 'color', type: 'color', default: '#000000'} ] },
        { type: 'create_code', label: 'Create Code Block', params: [ {name: 'language', type: 'text', default: 'javascript'}, {name: 'code', type: 'textarea', default: '// code'} ] },
    ],
    styling: [
        { type: 'style_color', label: 'Set Color', params: [ {name: 'target', type: 'text', default: 'last_created'}, {name: 'color', type: 'color', default: '#ff0000'} ] },
        { type: 'style_bg', label: 'Set Background', params: [ {name: 'target', type: 'text', default: 'slide'}, {name: 'color', type: 'color', default: '#ffffff'} ] },
        { type: 'style_font', label: 'Set Font', params: [ {name: 'target', type: 'text', default: 'last_created'}, {name: 'font', type: 'select', options: ['sans', 'serif', 'mono'], default: 'mono'} ] },
        { type: 'style_pos', label: 'Set Position', params: [ {name: 'target', type: 'text', default: 'last_created'}, {name: 'x', type: 'number', default: 0}, {name: 'y', type: 'number', default: 0} ] },
        { type: 'style_size', label: 'Set Size', params: [ {name: 'target', type: 'text', default: 'last_created'}, {name: 'w', type: 'number', default: 100}, {name: 'h', type: 'number', default: 100} ] },
        { type: 'style_opacity', label: 'Set Opacity', params: [ {name: 'target', type: 'text', default: 'last_created'}, {name: 'value', type: 'number', default: 0.5} ] },
        { type: 'style_border', label: 'Set Border', params: [ {name: 'width', type: 'number', default: 2}, {name: 'color', type: 'color', default: '#000000'} ] },
        { type: 'style_shadow', label: 'Set Shadow', params: [ {name: 'blur', type: 'number', default: 10}, {name: 'color', type: 'color', default: '#000000'} ] },
        { type: 'style_rotate', label: 'Rotate', params: [ {name: 'degrees', type: 'number', default: 45} ] },
        { type: 'anim_add', label: 'Add Animation', params: [ {name: 'type', type: 'select', options: ['fade', 'bounce', 'slide'], default: 'fade'}, {name: 'duration', type: 'number', default: 1} ] },
        { type: 'comp_hide', label: 'Hide Element', params: [ {name: 'target', type: 'text', default: 'last_created'} ] },
        { type: 'comp_show', label: 'Show Element', params: [ {name: 'target', type: 'text', default: 'last_created'} ] },
    ],
    data: [
        { type: 'var_set', label: 'Set Variable', params: [ {name: 'name', type: 'text', default: 'myVar'}, {name: 'value', type: 'text', default: ''} ] },
        { type: 'var_get', label: 'Get Variable', params: [ {name: 'name', type: 'text', default: 'myVar'}, {name: 'output_to', type: 'text', default: 'console'} ] },
        { type: 'math_add', label: 'Math: Add', params: [ {name: 'var1', type: 'text', default: 'a'}, {name: 'var2', type: 'text', default: 'b'}, {name: 'save_to', type: 'text', default: 'sum'} ] },
        { type: 'math_random', label: 'Random Number', params: [ {name: 'min', type: 'number', default: 0}, {name: 'max', type: 'number', default: 100}, {name: 'save_to', type: 'text', default: 'rnd'} ] },
        { type: 'str_concat', label: 'Concatenate', params: [ {name: 'str1', type: 'text', default: ''}, {name: 'str2', type: 'text', default: ''} ] },
        { type: 'date_now', label: 'Current Date', params: [ {name: 'format', type: 'text', default: 'ISO'} ] },
    ],
    logic: [
        { type: 'sys_wait', label: 'Wait (ms)', params: [ {name: 'time', type: 'number', default: 1000} ] },
        { type: 'sys_alert', label: 'Show Alert', params: [ {name: 'message', type: 'text', default: 'Hello!'} ] },
        { type: 'sys_log', label: 'Console Log', params: [ {name: 'message', type: 'text', default: 'Debug info'} ] },
        { type: 'flow_if', label: 'If Condition', params: [ {name: 'condition', type: 'text', default: 'true'} ], container: true },
        { type: 'flow_repeat', label: 'Repeat Loop', params: [ {name: 'times', type: 'number', default: 5} ], container: true },
        { type: 'nav_next', label: 'Next Slide', params: [] },
        { type: 'nav_prev', label: 'Prev Slide', params: [] },
        { type: 'nav_goto', label: 'Go to Slide', params: [ {name: 'index', type: 'number', default: 1} ] },
        { type: 'sys_open_url', label: 'Open URL', params: [ {name: 'url', type: 'text', default: 'https://'} ] },
    ]
};

export const BLANK_PRESENTATION: PresentationData = {
  id: 'new_deck',
  title: 'Untitled Project',
  theme: 'Lemon-Pop',
  slides: [
    {
      slide_number: 1,
      id: 'slide_1',
      title: 'Title Slide',
      duration_seconds: 30,
      animations: [],
      components: [
        {
          id: 'c1_1',
          type: 'text',
          content: 'HELLO WORLD',
          tool_tags: [],
          style: { fontSize: '4rem', fontWeight: 'bold', textAlign: 'center', top: '30%', left: '10%', width: '80%', position: 'absolute' }
        },
        {
          id: 'c1_2',
          type: 'text',
          content: 'Click to edit subtitle',
          tool_tags: [],
          style: { fontSize: '1.5rem', textAlign: 'center', top: '55%', left: '20%', width: '60%', position: 'absolute', color: '#666' }
        }
      ]
    }
  ]
};

// --- TEMPLATES+ DATA ---
export const TEMPLATE_LIBRARY = [
    {
        id: 'tmpl_startup',
        title: 'Startup Pitch',
        description: 'Bold, high-contrast layouts for making an impact.',
        slides: [
            {
                slide_number: 1, id: 't_s1', title: 'Big Title', components: [
                    { id: 't_c1', type: 'text', content: 'DISRUPT', style: { top: '15%', left: '5%', fontSize: '8rem', fontWeight: '900', color: '#000' }, fontFamily: 'display' },
                    { id: 't_c2', type: 'text', content: 'The Industry Standard', style: { top: '55%', left: '5%', fontSize: '2rem', color: '#666' }, fontFamily: 'sans' }
                ]
            },
            {
                slide_number: 2, id: 't_s2', title: 'Problem', components: [
                    { id: 't_c3', type: 'text', content: 'THE PROBLEM', style: { top: '10%', left: '5%', fontSize: '1.5rem', fontWeight: 'bold' }, fontFamily: 'mono' },
                    { id: 't_c4', type: 'text', content: 'Current solutions are too slow, too expensive, and lack style.', style: { top: '30%', left: '5%', width: '60%', fontSize: '3rem', fontWeight: 'bold' }, fontFamily: 'display' },
                    { id: 't_c5', type: 'custom', content: '<div style="width:100%;height:100%;background:#DFFF00;border:2px solid black"></div>', style: { top: '10%', right: '0', width: '30%', height: '100%', position: 'absolute' } }
                ]
            },
            {
                slide_number: 3, id: 't_s3', title: 'Stats', components: [
                    { id: 't_c6', type: 'chart', chartData: [{label:'Q1',value:20},{label:'Q2',value:45},{label:'Q3',value:80}], style: { top: '20%', left: '10%', width: '80%', height: '60%' } }
                ]
            }
        ]
    },
    {
        id: 'tmpl_creative',
        title: 'Creative Portfolio',
        description: 'Minimalist visuals with plenty of negative space.',
        slides: [
             {
                slide_number: 1, id: 't_c_s1', title: 'Intro', components: [
                    { id: 't_cc1', type: 'image', style: { top: '10%', left: '10%', width: '35%', height: '80%', border: '2px solid black' } },
                    { id: 't_cc2', type: 'text', content: 'PORTFOLIO\n2025', style: { top: '40%', left: '50%', fontSize: '4rem', fontWeight: 'bold' }, fontFamily: 'serif' }
                ]
            },
            {
                slide_number: 2, id: 't_c_s2', title: 'Gallery', components: [
                    { id: 't_cc3', type: 'image', style: { top: '10%', left: '5%', width: '28%', height: '40%' } },
                    { id: 't_cc4', type: 'image', style: { top: '10%', left: '36%', width: '28%', height: '40%' } },
                    { id: 't_cc5', type: 'image', style: { top: '10%', left: '67%', width: '28%', height: '40%' } },
                    { id: 't_cc6', type: 'text', content: 'Featured Works', style: { top: '60%', left: '5%', fontSize: '2rem' }, fontFamily: 'serif' }
                ]
            }
        ]
    },
    {
        id: 'tmpl_tech_conf',
        title: 'Neon Nights',
        description: 'Cyberpunk aesthetics for tech conferences and hackathons.',
        slides: [
            {
                slide_number: 1, id: 't_tc_1', title: 'Intro', backgroundColor: '#0f0f0f', components: [
                    { id: 'tc_c1', type: 'text', content: 'FUTURE\nVISION', style: { top: '20%', left: '5%', fontSize: '6rem', fontWeight: '900', color: '#00ffcc', lineHeight: 0.9 }, fontFamily: 'display', effects: { shadow: { color: '#00ffcc', blur: 20, x: 0, y: 0 } } },
                    { id: 'tc_c2', type: 'text', content: '2025 CONFERENCE', style: { top: '60%', left: '5%', fontSize: '1.5rem', color: '#ff00ff', letterSpacing: '0.2em' }, fontFamily: 'mono' },
                    { id: 'tc_c3', type: 'image', src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', style: { top: '0', right: '0', width: '50%', height: '100%', opacity: 0.6 } }
                ]
            },
            {
                slide_number: 2, id: 't_tc_2', title: 'Speakers', backgroundColor: '#0f0f0f', components: [
                    { id: 'tc_c4', type: 'text', content: 'KEYNOTE SPEAKERS', style: { top: '10%', left: '5%', fontSize: '2rem', color: '#fff', borderBottom: '2px solid #ff00ff' }, fontFamily: 'mono' },
                    { id: 'tc_c5', type: 'image', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', style: { top: '30%', left: '5%', width: '25%', height: '40%', borderRadius: '10px' } },
                    { id: 'tc_c6', type: 'image', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', style: { top: '30%', left: '35%', width: '25%', height: '40%', borderRadius: '10px' } },
                    { id: 'tc_c7', type: 'image', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', style: { top: '30%', left: '65%', width: '25%', height: '40%', borderRadius: '10px' } }
                ]
            }
        ]
    },
    {
        id: 'tmpl_nature',
        title: 'Earth & Soul',
        description: 'Organic tones and imagery for wellness brands.',
        slides: [
            {
                slide_number: 1, id: 't_n_1', title: 'Welcome', backgroundColor: '#f3f4f6', components: [
                     { id: 'n_c1', type: 'image', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', style: { top: '10%', left: '10%', width: '80%', height: '50%' } },
                     { id: 'n_c2', type: 'text', content: 'Reconnect with Nature', style: { top: '65%', left: '10%', fontSize: '3rem', color: '#3f6212' }, fontFamily: 'serif' }
                ]
            },
            {
                slide_number: 2, id: 't_n_2', title: 'Process', backgroundColor: '#f3f4f6', components: [
                    { id: 'n_c3', type: 'custom', content: '<div style="width:100%;height:100%;background:#dcfce7;border-radius:50%"></div>', style: { top: '20%', left: '10%', width: '200px', height: '200px' } },
                    { id: 'n_c4', type: 'custom', content: '<div style="width:100%;height:100%;background:#dcfce7;border-radius:50%"></div>', style: { top: '20%', left: '40%', width: '200px', height: '200px' } },
                    { id: 'n_c5', type: 'custom', content: '<div style="width:100%;height:100%;background:#dcfce7;border-radius:50%"></div>', style: { top: '20%', left: '70%', width: '200px', height: '200px' } },
                    { id: 'n_c6', type: 'text', content: 'Our sustainable approach', style: { top: '60%', left: '10%', width: '80%', textAlign: 'center', fontSize: '1.5rem', color: '#166534' }, fontFamily: 'sans' }
                ]
            }
        ]
    },
    {
        id: 'tmpl_corp',
        title: 'Blue Steel',
        description: 'Clean, trustworthy design for corporate reporting.',
        slides: [
            {
                slide_number: 1, id: 't_cp_1', title: 'Cover', backgroundColor: '#1e3a8a', components: [
                    { id: 'cp_c1', type: 'text', content: 'Q4 REPORT', style: { top: '40%', left: '10%', fontSize: '5rem', fontWeight: 'bold', color: '#fff' }, fontFamily: 'sans' },
                    { id: 'cp_c2', type: 'custom', content: '<div style="width:100%;height:4px;background:#93c5fd"></div>', style: { top: '35%', left: '0', width: '40%', height: '4px' } }
                ]
            },
            {
                slide_number: 2, id: 't_cp_2', title: 'Data', backgroundColor: '#ffffff', components: [
                    { id: 'cp_c3', type: 'text', content: 'Growth Metrics', style: { top: '10%', left: '5%', fontSize: '2rem', color: '#1e3a8a' }, fontFamily: 'sans' },
                    { id: 'cp_c4', type: 'chart', chartData: [{label: 'Jan', value: 30, color: '#1e3a8a'}, {label: 'Feb', value: 45, color: '#2563eb'}, {label: 'Mar', value: 60, color: '#60a5fa'}], style: { top: '25%', left: '5%', width: '90%', height: '60%' } }
                ]
            }
        ]
    },
    {
        id: 'tmpl_edu',
        title: 'Playground',
        description: 'Vibrant, fun, and engaging for education.',
        slides: [
             {
                slide_number: 1, id: 't_ed_1', title: 'Lesson', backgroundColor: '#fef08a', components: [
                    { id: 'ed_c1', type: 'text', content: 'MATH IS FUN!', style: { top: '20%', left: '10%', fontSize: '4rem', fontWeight: 'bold', color: '#ef4444', transform: 'rotate(-5deg)' }, fontFamily: 'display' },
                    { id: 'ed_c2', type: 'custom', content: '<div style="width:100%;height:100%;background:#3b82f6;border-radius:20px;border:4px solid #1e3a8a"></div>', style: { top: '10%', right: '10%', width: '150px', height: '150px', transform: 'rotate(10deg)' } },
                    { id: 'ed_c3', type: 'custom', content: '<div style="width:100%;height:100%;background:#22c55e;border-radius:50%;border:4px solid #14532d"></div>', style: { top: '60%', left: '50%', width: '100px', height: '100px' } }
                ]
            },
            {
                slide_number: 2, id: 't_ed_2', title: 'Activity', backgroundColor: '#fff', components: [
                    { id: 'ed_c4', type: 'text', content: 'Today\'s Activity:', style: { top: '10%', left: '5%', fontSize: '2rem', color: '#000' }, fontFamily: 'sans' },
                    { id: 'ed_c5', type: 'image', src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80', style: { top: '25%', left: '10%', width: '80%', height: '60%', borderRadius: '20px', border: '5px dashed #f59e0b' } }
                ]
            }
        ]
    },
    {
        id: 'tmpl_lux',
        title: 'Gold Standard',
        description: 'Sophisticated luxury for high-end brands.',
        slides: [
            {
                slide_number: 1, id: 't_lx_1', title: 'Brand', backgroundColor: '#000000', components: [
                    { id: 'lx_c1', type: 'text', content: 'ELEGANCE', style: { top: '35%', left: '20%', fontSize: '5rem', letterSpacing: '0.1em', color: '#d4af37' }, fontFamily: 'serif' },
                    { id: 'lx_c2', type: 'text', content: 'EST. 2025', style: { top: '55%', left: '45%', fontSize: '1rem', color: '#fff' }, fontFamily: 'sans' }
                ]
            },
            {
                slide_number: 2, id: 't_lx_2', title: 'Showcase', backgroundColor: '#1c1917', components: [
                     { id: 'lx_c3', type: 'image', src: 'https://images.unsplash.com/photo-1549488352-2266a878ce44?auto=format&fit=crop&w=600&q=80', style: { top: '10%', left: '10%', width: '35%', height: '80%' } },
                     { id: 'lx_c4', type: 'text', content: 'The Collection', style: { top: '40%', right: '10%', width: '40%', fontSize: '3rem', color: '#d4af37', textAlign: 'right' }, fontFamily: 'serif' }
                ]
            }
        ]
    }
];

const MIDNIGHT_PRESENTATION: PresentationData = {
    id: 'midnight_deck',
    title: 'Midnight Theme',
    theme: 'Dark-Mode',
    slides: [
        {
            slide_number: 1,
            id: 's_mid_1',
            title: 'Midnight',
            backgroundColor: '#000000',
            duration_seconds: 10,
            animations: [],
            components: [
                {
                    id: 'c_mid_1',
                    type: 'text',
                    content: 'NEO\nBRUTALISM',
                    style: { top: '20%', left: '10%', width: '80%', color: '#DFFF00', fontSize: '5rem', fontWeight: '900', textAlign: 'left', lineHeight: '0.9' },
                    fontFamily: 'display'
                },
                {
                    id: 'c_mid_2',
                    type: 'text',
                    content: 'The future is raw.',
                    style: { top: '60%', left: '10%', width: '50%', color: '#ffffff', fontSize: '1.5rem' },
                    fontFamily: 'mono'
                }
            ]
        }
    ]
};

const SWISS_PRESENTATION: PresentationData = {
    id: 'swiss_deck',
    title: 'Swiss Grid',
    theme: 'Swiss',
    slides: [
        {
            slide_number: 1,
            id: 's_swiss_1',
            title: 'Swiss',
            backgroundColor: '#f0f0f0',
            duration_seconds: 10,
            animations: [],
            components: [
                {
                    id: 'c_sw_1',
                    type: 'text',
                    content: 'Helvetica\nStandard',
                    style: { top: '10%', left: '5%', width: '90%', color: '#000000', fontSize: '4rem', fontWeight: 'bold', borderBottom: '4px solid #000' },
                    fontFamily: 'sans'
                },
                {
                    id: 'c_sw_2',
                    type: 'image',
                    src: '',
                    content: 'Image Placeholder',
                    style: { top: '40%', left: '5%', width: '40%', height: '50%', border: '2px solid #000' }
                },
                {
                    id: 'c_sw_3',
                    type: 'text',
                    content: 'A design system based on objectivity.',
                    style: { top: '40%', left: '50%', width: '45%', color: '#000000' },
                    fontFamily: 'sans'
                }
            ]
        }
    ]
};

export const TEMPLATES = [
    { id: 'blank', label: 'Clean Slate', data: BLANK_PRESENTATION, color: '#ffffff' },
    { id: 'midnight', label: 'Midnight', data: MIDNIGHT_PRESENTATION, color: '#000000' },
    { id: 'swiss', label: 'Swiss Grid', data: SWISS_PRESENTATION, color: '#f0f0f0' }
];

export const MOCK_SAVED_DECKS: PresentationData[] = [
  {
    ...BLANK_PRESENTATION,
    id: 'deck_1',
    title: 'Q3 Financial Review',
    slides: [{...BLANK_PRESENTATION.slides[0], title: 'Q3 Financials', components: [{...BLANK_PRESENTATION.slides[0].components[0], content: 'Q3 REPORT'}]}]
  },
  {
    ...BLANK_PRESENTATION,
    id: 'deck_2',
    title: 'Product Roadmap 2025',
    slides: [{...BLANK_PRESENTATION.slides[0], title: 'Roadmap', components: [{...BLANK_PRESENTATION.slides[0].components[0], content: 'ROADMAP'}]}]
  }
];

export const INITIAL_PRESENTATION: PresentationData = BLANK_PRESENTATION;
