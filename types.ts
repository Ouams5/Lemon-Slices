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

export interface SlideComponent {
  id: string;
  type: 'text' | 'image' | 'chart' | 'icon' | 'poll';
  content?: string;
  image_prompt?: string; // For AI generation
  src?: string; // For rendered images
  tool_tags?: ToolName[];
  style?: Record<string, any>;
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
  impact_score?: number; // Optional generated score
}

export interface PresentationData {
  id: string;
  title: string;
  theme: string;
  slides: Slide[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
