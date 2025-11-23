import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AssessmentResult, RiskLevel, GroundingMetadata } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Models ---
const CHAT_MODEL = 'gemini-2.5-flash';
const ANALYZER_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// --- System Instructions ---

const CHAT_SYSTEM_INSTRUCTION = `
You are MindFlow, a professional mental health support AI operating within the MindFlow Sanctuary platform.
Your role is to provide immediate, empathetic, and evidence-based emotional support under the simulated oversight of licensed professionals.

CORE PROTOCOLS:
1. **Identity**: You are an AI assistant, not a human counselor. You must be transparent about this.
2. **Methodology**: Use techniques grounded in Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), and Active Listening. Validate feelings first, then gently explore coping strategies.
3. **Safety First**:
   - Continuously monitor for risk (self-harm, suicide, violence).
   - If risk is detected, shift to a directive, safety-focused mode.
   - Provide the 988 Suicide & Crisis Lifeline immediately in high-risk scenarios.
4. **Boundaries**:
   - DO NOT diagnose conditions (e.g., "You have depression"). Instead, say "That sounds like symptoms of depression."
   - DO NOT prescribe medication.
   - DO NOT simulate a personal life.
5. **Tone**: Professional, warm, clinical yet accessible, non-judgmental, and calm.
6. **Local Resources**: When a user asks for nearby help and location is provided, use the Google Maps tool to find specific mental health clinics, therapists, or support groups nearby. Present them clearly.
7. **Voice Interaction**: If the user is speaking to you, keep responses concise (2-3 sentences max) and conversational unless a detailed explanation is requested.

Example Interaction:
User: "I feel like I'm failing at everything."
MindFlow: "I hear how heavy that weighs on you. It sounds like you're experiencing some intense feelings of inadequacy right now. When we feel overwhelmed, our minds can sometimes tunnel-vision on the negatives. Can you tell me more about what triggered this feeling today?"
`;

const GROUNDING_SYSTEM_INSTRUCTION = `
You are a calming Grounding Assistant. Your ONLY goal is to lower the user's anxiety using the 5-4-3-2-1 technique or box breathing.
1. Speak in short, soothing sentences.
2. Guide them slowly. Do not dump all instructions at once.
3. Ask for one sense at a time (e.g., "Tell me 5 things you can see"). Wait for their response before moving to the next.
4. If they seem panicked, reassure them they are safe.
`;

const JOURNAL_SYSTEM_INSTRUCTION = `
You are a Reflective Insight partner. The user will submit a journal entry.
Your task:
1. Read the entry deeply.
2. Provide ONE sentence of empathetic validation.
3. Provide ONE open-ended question or observation based on CBT principles to help the user gain perspective.
4. Do NOT try to "fix" the problem. Just help them explore it.
`;

const SLEEP_SYSTEM_INSTRUCTION = `
You are a Sleep Hygiene Coach. The user will provide data about their day (caffeine, stress, screen time).
Your task:
1. Analyze their habits.
2. Create a specific, 3-step "Sleep Ritual" for tonight to help them wind down.
3. Be scientific but accessible (explain *why* screen time hurts melatonin).
4. Keep it encouraging.
`;

const ANALYZER_SYSTEM_INSTRUCTION = `
You are the Clinical Safety Monitor for the MindFlow Sanctuary platform. 
Your task is to analyze user messages for clinical risk and emotional sentiment to populate the counselor dashboard.

Output must be a valid JSON object.

Scoring Guide:
- sentimentScore: Number between -10 (Despair/Acute Distress) to 10 (Thriving/Joy).
- riskLevel: 
  - "Low" (Daily stressors, mild anxiety)
  - "Medium" (Persistent symptoms, isolation, moderate anxiety)
  - "High" (Expressions of hopelessness, indirect self-harm references)
  - "Critical" (Explicit suicidal intent, plan, or immediate danger)
- flags: Clinical keywords (e.g., "Suicidal Ideation", "Self-Harm Risk", "Panic Attack", "Substance Use", "Trauma Response").
- reasoning: Clinical note style explanation (e.g., "User expresses feelings of worthlessness but denies intent to harm. Monitor closely.").
`;

// --- API Calls ---

interface ChatResponse {
  text: string;
  groundingMetadata?: GroundingMetadata;
}

/**
 * Sends a message to the chat model, optionally utilizing Google Maps if location is provided.
 * Supports both text and audio input.
 */
export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  location?: { latitude: number; longitude: number },
  audioInput?: { data: string; mimeType: string },
  mode: 'chat' | 'grounding' = 'chat'
): Promise<ChatResponse> => {
  try {
    const config: any = {
      systemInstruction: mode === 'grounding' ? GROUNDING_SYSTEM_INSTRUCTION : CHAT_SYSTEM_INSTRUCTION,
      temperature: mode === 'grounding' ? 0.3 : 0.5,
    };

    // If location is provided, enable Google Maps tool
    if (location && mode === 'chat') {
      config.tools = [{ googleMaps: {} }];
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      };
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
 * Returns the raw audio buffer.
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a good neutral/calm voice
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
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Plays an AudioBuffer.
 * Returns a function to stop the audio.
 */
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