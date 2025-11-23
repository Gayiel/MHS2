

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface AssessmentResult {
  riskLevel: RiskLevel;
  sentimentScore: number; // -10 to 10 (Negative to Positive)
  flags: string[];
  reasoning: string;
  timestamp: string;
}

export interface GroundingMetadata {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
    maps?: {
      placeId: string;
      title: string;
      uri: string; // Google Maps URL
    };
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  assessment?: AssessmentResult; // Only present on user messages after analysis
  groundingMetadata?: GroundingMetadata; // Present if map/web data is returned
}

export interface ChatSession {
  id: string;
  startTime: Date;
  messages: Message[];
}

export interface Resource {
  name: string;
  description: string;
  contactDisplay: string;
  actionValue: string;
  type: 'hotline' | 'text' | 'website';
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: 'Research' | 'Community' | 'Wellness' | 'Policy';
  readTime: string;
}

export const CRISIS_RESOURCES: Resource[] = [
  {
    name: "988 Suicide & Crisis Lifeline (US)",
    description: "24/7, free and confidential support.",
    contactDisplay: "Call 988",
    actionValue: "988",
    type: "hotline"
  },
  {
    name: "Crisis Text Line",
    description: "Text HOME to connect with a Counselor.",
    contactDisplay: "Text HOME to 741741",
    actionValue: "741741",
    type: "text"
  },
  {
    name: "Samaritans (UK)",
    description: "Whatever you're going through, call us.",
    contactDisplay: "Call 116 123",
    actionValue: "116123",
    type: "hotline"
  },
  {
    name: "Canada Suicide Prevention",
    description: "24/7 support across Canada.",
    contactDisplay: "1-833-456-4566",
    actionValue: "18334564566",
    type: "hotline"
  },
  {
    name: "International Help",
    description: "Find a helpline in your country.",
    contactDisplay: "findahelpline.com",
    actionValue: "https://findahelpline.com",
    type: "website"
  },
  {
    name: "Emergency Services",
    description: "Immediate danger to life or safety.",
    contactDisplay: "Call 911",
    actionValue: "911",
    type: "hotline"
  }
];