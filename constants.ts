import { PresentationData, ToolName } from './types';
import { 
  Palette, GitGraph, BarChart3, Wand2, Mic, Layers, 
  Smile, Share2, Activity, Type, FileText, Vote 
} from 'lucide-react';

export const TOOLS: { id: ToolName; label: string; icon: any; description: string }[] = [
  { id: 'Aether-Paint', label: 'Aether-Paint', icon: Palette, description: 'Generates photorealistic backgrounds based on mood keywords.' },
  { id: 'Logic-Flow', label: 'Logic-Flow', icon: GitGraph, description: 'Rearranges slice order based on narrative impact.' },
  { id: 'Data-Whisperer', label: 'Data-Whisperer', icon: BarChart3, description: 'Converts raw CSV data into interactive 3D charts.' },
  { id: 'Tone-Shifter', label: 'Tone-Shifter', icon: Wand2, description: 'Rewrites text to be more persuasive, concise, or humorous.' },
  { id: 'Voice-Sync', label: 'Voice-Sync', icon: Mic, description: 'Generates AI voiceover narrations synced to transitions.' },
  { id: 'Style-Transfer', label: 'Style-Transfer', icon: Layers, description: 'Applies complex design themes instantly.' },
  { id: 'Auto-Icon', label: 'Auto-Icon', icon: Smile, description: 'Scans text and generates relevant vector icons.' },
  { id: 'Context-Bridge', label: 'Context-Bridge', icon: Share2, description: 'Creates smooth transition animations between slices.' },
  { id: 'Impact-Score', label: 'Impact-Score', icon: Activity, description: 'Analyzes visual clarity and engagement (0-100).' },
  { id: 'Font-Pairer', label: 'Font-Pairer', icon: Type, description: 'Suggests typography based on content.' },
  { id: 'Draft-to-Deck', label: 'Draft-to-Deck', icon: FileText, description: 'Converts a long document into a 10-slice outline.' },
  { id: 'Live-Poll', label: 'Live-Poll', icon: Vote, description: 'Generates interactive slices for audience feedback.' },
];

export const INITIAL_PRESENTATION: PresentationData = {
  id: 'pres_001',
  title: 'AI Ethics: Navigating the Future',
  theme: 'Neo-Brutalism',
  slides: [
    {
      slide_number: 1,
      id: 'slide_1',
      title: 'The Ethical Frontier',
      duration_seconds: 30,
      animations: [],
      components: [
        {
          id: 'c1_1',
          type: 'text',
          content: 'AI Ethics: Navigating the Future',
          tool_tags: ['Font-Pairer'],
          style: { fontSize: '3rem', fontWeight: 'bold' }
        },
        {
          id: 'c1_2',
          type: 'image',
          image_prompt: 'A monolithic obsidian structure glowing with lemon yellow veins in a foggy digital landscape, cinematic lighting, 8k.',
          tool_tags: ['Aether-Paint'],
          style: { width: '100%', height: '300px' }
        }
      ]
    },
    {
      slide_number: 2,
      id: 'slide_2',
      title: 'The Bias Dilemma',
      duration_seconds: 45,
      animations: [{ type: 'Morph', target_slide_id: 'slide_3', duration: 1.5 }],
      components: [
        {
          id: 'c2_1',
          type: 'text',
          content: 'Algorithmic Bias in Decision Making',
          style: { fontSize: '2rem' }
        },
        {
          id: 'c2_2',
          type: 'text',
          content: 'How training data reflects historical prejudices.',
          tool_tags: ['Tone-Shifter'],
          style: { fontSize: '1.2rem', marginTop: '1rem' }
        },
        {
          id: 'c2_3',
          type: 'chart',
          content: 'Data: { "Biased": 65, "Neutral": 25, "Corrected": 10 }',
          tool_tags: ['Data-Whisperer'],
          style: { height: '200px' }
        }
      ]
    },
    {
      slide_number: 3,
      id: 'slide_3',
      title: 'Transparency & Explainability',
      duration_seconds: 40,
      animations: [],
      components: [
        {
          id: 'c3_1',
          type: 'text',
          content: 'The "Black Box" Problem',
          style: { fontSize: '2rem' }
        },
        {
          id: 'c3_2',
          type: 'image',
          image_prompt: 'A transparent glass cube containing a glowing neural network, complex geometry, hyper-realistic.',
          tool_tags: ['Aether-Paint'],
          style: { width: '100%', height: '250px' }
        }
      ]
    },
    {
      slide_number: 4,
      id: 'slide_4',
      title: 'Workforce Disruption',
      duration_seconds: 50,
      animations: [{ type: 'Fade', target_slide_id: 'slide_5', duration: 1.0 }],
      components: [
        {
          id: 'c4_1',
          type: 'text',
          content: 'Automation vs. Augmentation',
          style: { fontSize: '2rem' }
        },
        {
          id: 'c4_2',
          type: 'icon',
          content: 'Robot Handshake',
          tool_tags: ['Auto-Icon'],
          style: { width: '100px', height: '100px' }
        },
        {
          id: 'c4_3',
          type: 'poll',
          content: 'Poll: Will AI create more jobs than it displaces?',
          tool_tags: ['Live-Poll'],
          style: { border: '1px solid #DFFF00', padding: '1rem' }
        }
      ]
    },
    {
      slide_number: 5,
      id: 'slide_5',
      title: 'Governing the Superintelligence',
      duration_seconds: 60,
      animations: [],
      components: [
        {
          id: 'c5_1',
          type: 'text',
          content: 'A Framework for Global Safety',
          tool_tags: ['Tone-Shifter'],
          style: { fontSize: '2.5rem' }
        },
        {
          id: 'c5_2',
          type: 'text',
          content: 'Conclusion: Proactive regulation is key.',
          style: { fontSize: '1.5rem', color: '#DFFF00' }
        }
      ]
    }
  ]
};