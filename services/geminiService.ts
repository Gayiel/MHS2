import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AssessmentResult, RiskLevel } from '../types';

// Initialize Gemini Client
// The API key is assumed to be in process.env.API_KEY as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Models ---
const CHAT_MODEL = 'gemini-2.5-flash';
const ANALYZER_MODEL = 'gemini-2.5-flash';

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

Example Interaction:
User: "I feel like I'm failing at everything."
MindFlow: "I hear how heavy that weighs on you. It sounds like you're experiencing some intense feelings of inadequacy right now. When we feel overwhelmed, our minds can sometimes tunnel-vision on the negatives. Can you tell me more about what triggered this feeling today?"
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

/**
 * Sends a message to the chat model.
 */
export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.5, // Lower temperature for more professional/consistent responses
      },
      history: history,
    });

    const result = await chat.sendMessage({
      message: message,
    });

    return result.text || "I am currently reconnecting to the secure server. Please wait a moment.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I apologize, but I am unable to access the response module at the moment. If you are in crisis, please call 988 immediately.";
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