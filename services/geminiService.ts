
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const checkApiKey = () => !!ai;

// Tool: Tone-Shifter
export const runToneShifter = async (text: string, tone: 'persuasive' | 'concise' | 'humorous'): Promise<string> => {
  if (!ai) throw new Error("API Key missing");
  const model = "gemini-3-flash-preview";
  const prompt = `Rewrite the following text to be more ${tone}. Use simple Markdown formatting if appropriate (e.g., **bold** for emphasis). Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Tone-Shifter Error:", error);
    return text;
  }
};

// Tool: Aether-Paint (Image Generation)
export const runAetherPaint = async (prompt: string): Promise<string> => {
  if (!ai) throw new Error("API Key missing");
  
  // Using gemini-2.5-flash-image for generation
  const model = "gemini-2.5-flash-image"; 

  try {
    // Generate image content
    const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {}
    });
    
    // Scan parts for image
    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                imageUrl = `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
                break;
            }
        }
    }

    if (!imageUrl) {
        return `https://picsum.photos/seed/${encodeURIComponent(prompt).substring(0, 10)}/800/600`;
    }

    return imageUrl;

  } catch (error) {
    console.warn("Aether-Paint Error (using fallback):", error);
    return `https://picsum.photos/seed/${encodeURIComponent(prompt).substring(0, 10)}/800/600`;
  }
};

// Tool: Draft-to-Deck (The Works)
export const runDraftToDeck = async (topic: string): Promise<any> => {
  if (!ai) throw new Error("API Key missing");

  // Use Gemini 3 Pro for complex reasoning + Search
  const model = "gemini-3-pro-preview";
  
  const prompt = `Create a professional presentation about: "${topic}".
  
  1. Use the internet to find 3-4 up-to-date facts or trends about this topic.
  2. Structure: 4-6 slides total.
  3. Layout: Each slide can contain multiple components (text, image, chart, poll).
  4. Content: Use Markdown (## Headers, **bold**, *lists*) for text content.
  5. Styling:
     - Choose a 'backgroundColor' for the slide.
     - Choose a 'transition' type.
     - For EACH component, specify a 'font' ('sans', 'serif', 'mono', 'display').
     - Estimate CSS position/size in percentages (top, left, width, height) to create a good layout.
  
  Return JSON matching this schema:
  {
      "title": "Deck Title",
      "slides": [
          {
              "title": "Slide Title",
              "backgroundColor": "#FFFFFF",
              "transition": "fade",
              "components": [
                  {
                      "type": "text",
                      "content": "Markdown content...",
                      "font": "sans",
                      "style": { "top": "10%", "left": "10%", "width": "80%", "height": "20%" }
                  },
                  {
                      "type": "image",
                      "image_prompt": "Visual description...",
                      "style": { "top": "30%", "left": "10%", "width": "40%", "height": "50%" }
                  },
                  {
                      "type": "chart",
                      "chartData": [ {"label": "A", "value": 10}, {"label": "B", "value": 20} ],
                      "font": "mono",
                      "style": { "top": "30%", "left": "55%", "width": "35%", "height": "50%" }
                  },
                  {
                      "type": "poll",
                      "pollQuestion": "Question?",
                      "pollOptions": [ {"text": "Yes", "votes": 0}, {"text": "No", "votes": 0} ],
                      "font": "display",
                      "style": { "top": "80%", "left": "10%", "width": "80%", "height": "15%" }
                  }
              ]
          }
      ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
      }
    });

    let text = response.text || '{"slides": []}';
    // Clean potential markdown code blocks
    if (text.startsWith('```json')) {
        text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Draft-to-Deck Error:", error);
    return { 
        title: topic, 
        slides: [
            { 
                title: "Error Generating Deck", 
                backgroundColor: "#FFFFFF",
                components: [{
                    type: "text",
                    content: "We encountered an issue connecting to the AI brain. Please try again.",
                    style: { top: "40%", left: "10%", width: "80%" }
                }]
            }
        ] 
    };
  }
};

// Tool: Extension Builder
export const runExtensionBuilder = async (prompt: string): Promise<any> => {
    if (!ai) throw new Error("API Key missing");
    const model = "gemini-3-flash-preview";
    
    const sysPrompt = `You are an expert Presentation Plugin Architect. Build a JSON plugin definition based on the user's description.
    
    Structure:
    - 'logic' array contains executable blocks.
    - Blocks can be NESTED inside 'children' array for containers like 'flow_repeat' or 'flow_if'.
    
    Available Blocks & Params:
    - create_text (content, x, y, color, font)
    - create_image (src, x, y, width, height)
    - create_shape (shape='rect'|'circle', color, x, y, size)
    - style_color (target='last_created', color)
    - flow_repeat (times, children=[])  <-- Use 'children' for inner blocks
    - flow_if (condition, children=[])
    
    Example Output:
    {
        "name": "Red Circle Loop",
        "description": "Creates 5 red circles",
        "version": "1.0.0",
        "author": "AI",
        "logic": [
            { 
                "id": "loop1", 
                "type": "flow_repeat", 
                "params": { "times": 5 },
                "children": [
                    { "id": "c1", "type": "create_shape", "params": { "shape": "circle", "color": "#FF0000", "x": 10, "y": 10, "size": 50 } }
                ]
            }
        ],
        "variables": []
    }`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: sysPrompt,
                responseMimeType: "application/json"
            }
        });
        
        let text = response.text || '{}';
        if (text.startsWith('```json')) {
            text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        return JSON.parse(text);
    } catch (e) {
        console.error("Extension Builder Error", e);
        return null;
    }
}
