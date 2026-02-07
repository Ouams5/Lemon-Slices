
export interface User {
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  subscription_tier: 'Free' | 'Pro' | 'Enterprise';
}

export type ToolName = 
  | 'Aether-Paint' 
  | 'Logic-Flow' 
  | 'Data-Whisperer' 
  | 'Tone-Shifter' 
  | 'Voice-Sync' 
  | 'Style-Transfer' 
  | 'Auto-Icon' 
  | 'Context-Bridge' 
  | 'Impact-Score' 
  | 'Font-Pairer' 
  | 'Draft-to-Deck' 
  | 'Live-Poll';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface ComponentEffects {
  shadow?: {
    color: string;
    blur: number;
    x: number;
    y: number;
  };
  outline?: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
  opacity?: number; // 0 to 1
  blur?: number; // px
  rotation?: number; // degrees
}

export interface AnimationConfig {
    name: string;
    duration: number; // in seconds
    delay: number; // in seconds
    iterationCount?: number | 'infinite';
}

export interface LogicBlock {
    id: string;
    type: string;
    params: Record<string, any>;
    children?: LogicBlock[]; // For nesting (Scratch-like)
}

export interface PluginVariable {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color';
    value: any;
}

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon: string; // Name of lucide icon or 'Puzzle' default
  
  logic: LogicBlock[];
  variables?: PluginVariable[];

  // Legacy payload for backward compatibility or simple tools
  payload: {
    type: 'text' | 'image' | 'chart' | 'poll' | 'custom';
    content?: string; 
    style?: Record<string, any>; 
    width?: number;
    height?: number;
    data?: any; 
  }
}

export interface SlideComponent {
  id: string;
  groupId?: string; // If present, this component is part of a group
  type: 'text' | 'image' | 'chart' | 'icon' | 'poll' | 'custom';
  content?: string;
  image_prompt?: string; // For AI generation
  src?: string; // For rendered images
  
  // Data Structures
  chartData?: ChartDataPoint[];
  pollQuestion?: string;
  pollOptions?: PollOption[];
  
  // Styling
  tool_tags?: ToolName[];
  style?: Record<string, any>; // CSS Properties (top, left, width, height)
  effects?: ComponentEffects; // Visual Effects
  animation?: AnimationConfig; // Better Animations Extension
  
  fontFamily?: 'sans' | 'serif' | 'mono' | 'display';
  textColor?: string;
  backgroundColor?: string; // For component background
  isGradient?: boolean;
}

export interface SlideAnimation {
  type: string;
  target_slide_id: string;
  duration: number;
}

export interface Slide {
  slide_number: number;
  id: string;
  title: string;
  components: SlideComponent[];
  duration_seconds: number;
  animations: SlideAnimation[];
  impact_score?: number; 
  baseFont?: 'sans' | 'serif' | 'mono' | 'display';
  backgroundColor?: string;
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
}

export interface PresentationData {
  id: string;
  uid?: string; // Owner ID
  title: string;
  theme: string;
  slides: Slide[];
  created_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
