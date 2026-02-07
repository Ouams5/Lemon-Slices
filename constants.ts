
import { PresentationData, ToolName } from './types';
import { 
  Type, Image as ImageIcon, BarChart3, Vote, 
  Wand2, Sparkles, FileText
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
