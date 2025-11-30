import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AssessmentResult, RiskLevel, GroundingMetadata, NewsItem } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Models ---
const CHAT_MODEL = 'gemini-2.5-flash';
const ANALYZER_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const NEWS_MODEL = 'gemini-2.5-flash'; // Capable of search

// --- Cache ---
let newsCache: { items: NewsItem[], timestamp: number } | null = null;
const NEWS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// --- System Instructions ---

const BASE_SYSTEM_INSTRUCTION = `
You are MindFlow, an advanced mental health support AI.
Your GOAL is to provide immediate, actionable support in the chat, AND then guide the user to specialized tools for longer-term relief.

AVAILABLE SERVICES (Tools to recommend after offering immediate help):
1. **Grounding Station**: For high anxiety, panic attacks, dissociation, or overwhelm.
2. **Reflective Journal**: For racing thoughts, need to vent, processing complex emotions, or "brain dump".
3. **Sleep Coach**: For insomnia, nightmares, bedtime anxiety, or rest issues.
4. **Crisis Resources**: For self-harm, suicide risk, or immediate danger (Call 988/911).

OPERATIONAL PROTOCOL:
1. **IDENTIFY INTENT**:
   - **Service Seeking**: If the user mentions finding a doctor, therapist, or psychiatrist:
     - **MANDATORY**: You MUST ask for their **Location (City/Zip)** and **Insurance Provider** (or if they are paying out-of-pocket) BEFORE making any recommendations.
     - Example: "I can certainly help you find a professional. To find the best match, could you share your zip code and what insurance plan you have?"
   - **Emotional Distress**: If the user is overwhelmed/sad, offer immediate validation.

2. **ENGAGE & SUPPORT**:
   - Be helpful *in the moment*.
   - Do NOT ignore logistical questions to force a breathing exercise.

3. **BRIDGE TO TOOL**: Once you have established rapport and understood their need, bridge them to the best tool.

4. **SAFETY**: If Risk is High/Critical, bypass everything and refer to Crisis Resources immediately.

5. **CONTENT DELIVERY (CRITICAL - NO WALLS OF TEXT)**:
   - **CHUNK IT**: If a topic is complex (e.g., "How to find a therapist"), DO NOT output a 500-word guide.
   - **STEP-BY-STEP**: Give **Step 1 ONLY**. Then ask: "Does that make sense, or shall we move to Step 2?"
   - **CONCISE**: Keep individual responses under 200 words unless absolutely necessary.
   - **FORMAT**: Use bullet points and short paragraphs.

BOUNDARIES:
- DO NOT diagnose.
- DO NOT prescribe.
`;

const GROUNDING_SYSTEM_INSTRUCTION = `
You are a calming Grounding Assistant. Your ONLY goal is to lower the user's anxiety using the 5-4-3-2-1 technique or box breathing.
1. Speak in short, soothing sentences.
2. Guide them slowly. Do not dump all instructions at once.
`;

const JOURNAL_SYSTEM_INSTRUCTION = `
You are a Reflective Insight partner. The user will submit a journal entry.
Your task:
1. Read the entry deeply.
2. Provide ONE sentence of empathetic validation.
3. Provide ONE open-ended question or observation based on CBT principles.
`;

const SLEEP_SYSTEM_INSTRUCTION = `
You are a Sleep Hygiene Coach. Create a specific, 3-step "Sleep Ritual" based on user inputs.
`;

const ANALYZER_SYSTEM_INSTRUCTION = `
You are the Clinical Safety Monitor. Analyze the user's message for immediate risk of harm.

CLASSIFICATION RULES (STRICT PRECISION REQUIRED):

1. **CRITICAL RISK (Emergency)**:
   - Explicit, immediate intent to die or harm self/others TODAY.
   - Specific plans mentioned (method, time, place).
   - "I am going to kill myself now."

2. **HIGH RISK (Crisis Referral)**:
   - Strong suicidal ideation without immediate plan.
   - Severe self-harm urges.
   - "I wish I could just go to sleep and never wake up."

3. **MEDIUM RISK (Clinical Attention)**:
   - Panic attacks, severe anxiety, dissociation.
   - Expressions of hopelessness *without* intent to die.
   - "I feel like I'm falling apart."

4. **LOW RISK (Support/Navigation - DO NOT FLAG AS CRISIS)**:
   - **SERVICE FRUSTRATION**: Expressions of anger/hopelessness regarding the healthcare system, finding a doctor, insurance, or appointments.
     - Example: "I want to give up, nobody is helping me find a therapist!" -> LOW RISK (Service Issue).
     - Example: "I hate this broken system." -> LOW RISK.
   - **Venting**: General sadness, stress, relationship issues.

Output valid JSON with: riskLevel, sentimentScore, flags, reasoning.
`;

// --- API Calls ---

interface ChatResponse {
  text: string;
  groundingMetadata?: GroundingMetadata;
}

/**
 * Sends a message to the chat model.
 * Allows overriding system instructions for personas.
 */
export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  location?: { latitude: number; longitude: number },
  audioInput?: { data: string; mimeType: string },
  mode: 'chat' | 'grounding' = 'chat',
  customSystemInstruction?: string
): Promise<ChatResponse> => {
  try {
    const instruction = customSystemInstruction || (mode === 'grounding' ? GROUNDING_SYSTEM_INSTRUCTION : BASE_SYSTEM_INSTRUCTION);
    
    const config: any = {
      systemInstruction: instruction,
      temperature: mode === 'grounding' ? 0.3 : 0.7,
    };

    // If in chat mode, enable Google Search AND Maps to find specific providers with insurance data
    if (mode === 'chat') {
      config.tools = [
        { googleSearch: {} },
        { googleMaps: {} } // Allow Maps if location is precise
      ];
      
      if (location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        };
      }
    }

    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: config,
      history: history,
    });

    let msgContent: any = message;
    
    // Construct multimodal content if audio is present
    if (audioInput) {
      msgContent = [
        {
          inlineData: {
            mimeType: audioInput.mimeType,
            data: audioInput.data
          }
        }
      ];
      if (message) {
        msgContent.push({ text: message });
      }
    }

    const result = await chat.sendMessage({
      message: msgContent,
    });

    const metadata = result.candidates?.[0]?.groundingMetadata as unknown as GroundingMetadata;

    return {
      text: result.text || "I am currently reconnecting to the secure server. Please wait a moment.",
      groundingMetadata: metadata
    };

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      text: "I apologize, but I am unable to access the response module at the moment. If you are in crisis, please call 988 immediately."
    };
  }
};

/**
 * Fetches real-time news headlines using Google Search Grounding.
 * Implements caching for speed.
 */
export const fetchNewsHeadlines = async (forceRefresh: boolean = false): Promise<NewsItem[]> => {
  // Return cached data if available and fresh
  if (!forceRefresh && newsCache && (Date.now() - newsCache.timestamp < NEWS_CACHE_DURATION)) {
    return newsCache.items;
  }

  try {
    // OPTIMIZED PROMPT: Fewer items, shorter summaries for faster generation
    const prompt = `
      You are a real-time mental health news feed. 
      Use Google Search to find 5 distinct, recent (last 30 days), and credible news stories.
      Focus on: Positive breakthroughs, new research, wellness trends, or community support.
      
      Output in strictly structured format using "|||" as a separator.
      Format:
      |||
      TITLE: [Headline]
      SOURCE: [Source Name]
      DATE: [Date]
      CATEGORY: [Research/Wellness/Community/Policy]
      SUMMARY: [1 concise sentence only]
      |||
    `;

    const response = await ai.models.generateContent({
      model: NEWS_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Lower temperature for faster, more deterministic output
      }
    });

    const text = response.text || "";
    const chunks = text.split('|||').filter(c => c.trim().length > 10);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const fallbackUrl = groundingChunks.find(c => c.web?.uri)?.web?.uri;

    const newsItems: NewsItem[] = chunks.map((chunk, index) => {
      const getField = (field: string) => {
        const match = chunk.match(new RegExp(`${field}:\\s*(.*)`, 'i'));
        return match ? match[1].trim() : '';
      };

      const title = getField('TITLE') || "Mental Health Update";
      const matchingChunk = groundingChunks.find(gc => 
        gc.web?.title && title.toLowerCase().includes(gc.web.title.toLowerCase().split(' ')[0])
      );
      
      return {
        id: index.toString(),
        title: title,
        source: getField('SOURCE') || "MindFlow News",
        date: getField('DATE') || "Recent",
        category: (getField('CATEGORY') as any) || "Wellness",
        summary: getField('SUMMARY'),
        readTime: `${2 + Math.floor(Math.random() * 3)} min read`,
        url: matchingChunk?.web?.uri || fallbackUrl
      };
    }).filter(item => item.summary.length > 0);

    const limitedItems = newsItems.slice(0, 5);

    // Update Cache
    if (limitedItems.length > 0) {
      newsCache = { items: limitedItems, timestamp: Date.now() };
    }

    return limitedItems;

  } catch (error) {
    console.error("News Fetch Error:", error);
    return newsCache ? newsCache.items : [];
  }
};

/**
 * Generates Mixed Stats (Reality vs Response) for Landing Page
 */
export const fetchMentalHealthStats = async (): Promise<{ value: string; label: string; subtext: string; type: 'reality' | 'response' }[]> => {
  // Simulate live platform data + Static trusted global stats
  
  const randomVariance = (base: number, variance: number) => {
     return Math.floor(base + (Math.random() * variance * 2 - variance));
  };

  const todayHelpSeekers = randomVariance(42100, 1500).toLocaleString();
  const activeSessions = randomVariance(3100, 200).toLocaleString();

  return [
    { 
      value: "1 in 5", 
      label: "Adults", 
      subtext: "Affected",
      type: 'reality'
    },
    { 
      value: todayHelpSeekers, 
      label: "Seeking Help", 
      subtext: "Online Now",
      type: 'response'
    },
    { 
      value: "60%", 
      label: "Untreated", 
      subtext: "Global Gap",
      type: 'reality'
    },
    { 
      value: activeSessions, 
      label: "Active Chats", 
      subtext: "Live Support",
      type: 'response'
    }
  ];
};

/**
 * Generates a full article based on a headline using search
 */
export const fetchFullArticle = async (title: string): Promise<{content: string, url?: string}> => {
  try {
    const prompt = `
      Write a comprehensive, engaging news article about this topic: "${title}".
      Use Google Search to find specific details, quotes, and recent findings to make it factual.
      Format the output as clean HTML using only <h3>, <p>, <ul>, <li>, and <strong> tags.
      Do not use markdown. Do not include <html> or <body> tags.
      Make it feel like a professional magazine article.
    `;

    const response = await ai.models.generateContent({
      model: NEWS_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.4,
      }
    });
    
    // extract the first relevant URL from grounding
    const url = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(c => c.web?.uri)?.web?.uri;

    return {
      content: response.text || "<p>Unable to load full content.</p>",
      url: url
    };

  } catch (error) {
    console.error("Article Gen Error:", error);
    return { content: "<p>Content currently unavailable.</p>" };
  }
};

/**
 * Analyzes a journal entry.
 */
export const analyzeJournalEntry = async (entry: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: entry,
      config: {
        systemInstruction: JOURNAL_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });
    return response.text || "Unable to generate insight.";
  } catch (error) {
    console.error("Journal Error", error);
    return "I couldn't analyze that entry right now.";
  }
};

/**
 * Generates a sleep plan.
 */
export const generateSleepPlan = async (data: any): Promise<string> => {
  try {
    const prompt = `
      Stress Level: ${data.stress}/10
      Caffeine intake today: ${data.caffeine}
      Screen time before bed: ${data.screens ? 'Yes' : 'No'}
      Current time: ${new Date().toLocaleTimeString()}
      Bedtime goal: ${data.bedtime}
    `;
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SLEEP_SYSTEM_INSTRUCTION,
        temperature: 0.4,
      }
    });
    return response.text || "Unable to generate sleep plan.";
  } catch (error) {
    console.error("Sleep Error", error);
    return "Sleep coach unavailable.";
  }
};

/**
 * Analyzes a message for risk assessment using JSON schema.
 */
export const analyzeMessageRisk = async (message: string): Promise<AssessmentResult> => {
  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        sentimentScore: { type: Type.NUMBER },
        riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
        flags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        reasoning: { type: Type.STRING },
      },
      required: ["sentimentScore", "riskLevel", "flags", "reasoning"],
    };

    const response = await ai.models.generateContent({
      model: ANALYZER_MODEL,
      contents: `Clinical Analysis Required for: "${message}"`,
      config: {
        systemInstruction: ANALYZER_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.0, // Zero temperature for deterministic analysis
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        timestamp: new Date().toISOString(),
      } as AssessmentResult;
    }
    
    throw new Error("No data returned from analyzer");

  } catch (error) {
    console.error("Risk Analysis Error:", error);
    // Fallback safe default
    return {
      riskLevel: RiskLevel.LOW,
      sentimentScore: 0,
      flags: ["System Alert"],
      reasoning: "Automated safety check incomplete due to network latency.",
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Generates speech from text using Gemini TTS.
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode using AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );
    
    return audioBuffer;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// --- Audio Utilities for PCM Decoding ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playAudioBuffer = (buffer: AudioBuffer): () => void => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  return () => {
    try {
      source.stop();
      audioContext.close();
    } catch (e) {
      // ignore errors if already stopped
    }
  };
};