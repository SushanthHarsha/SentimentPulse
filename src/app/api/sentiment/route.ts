import { NextRequest, NextResponse } from 'next/server';

// Environment variable validation - API key must be set in production
const API_KEY = process.env.GEMINI_API_KEY;

// Rate limiting: simple in-memory store (use Redis in production for multiple instances)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

interface SentimentData {
  overall: {
    positive: number;
    negative: number;
    neutral: number;
  };
  score: number; // -100 to 100
  summary: string;
  keyTopics: {
    topic: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    mentions: number;
  }[];
  recentMentions: {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    source: string;
  }[];
  concerns: string[];
  positives: string[];
  sources: { url: string; title: string }[];
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!API_KEY) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { policy } = await request.json();

    // Input validation
    if (!policy || typeof policy !== 'string') {
      return NextResponse.json(
        { error: 'Policy name is required' },
        { status: 400 }
      );
    }

    // Sanitize and limit input length
    const sanitizedPolicy = policy.trim().slice(0, 200);
    
    if (sanitizedPolicy.length < 2) {
      return NextResponse.json(
        { error: 'Policy name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const prompt = `Analyze the current public sentiment about "${sanitizedPolicy}" in India. Search for recent news, social media discussions, and public opinions.

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "overall": {
    "positive": <percentage 0-100>,
    "negative": <percentage 0-100>,
    "neutral": <percentage 0-100>
  },
  "score": <number from -100 (very negative) to 100 (very positive)>,
  "summary": "<2-3 sentence summary of overall public sentiment>",
  "keyTopics": [
    {"topic": "<topic name>", "sentiment": "positive|negative|neutral", "mentions": <estimated relative mention count 1-100>},
    ... (provide 5-7 key topics)
  ],
  "recentMentions": [
    {"text": "<brief quote or paraphrase of public opinion>", "sentiment": "positive|negative|neutral", "source": "<source type: Twitter/Reddit/News/Forum>"},
    ... (provide 5-6 recent mentions)
  ],
  "concerns": ["<main public concern 1>", "<concern 2>", ... (3-5 concerns)],
  "positives": ["<positive aspect 1>", "<positive 2>", ... (3-5 positives)]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          tools: [
            {
              google_search: {},
            },
          ],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze sentiment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the text response
    const textParts = data.candidates?.[0]?.content?.parts || [];
    const textResponse = textParts
      .filter((part: { text?: string }) => part.text)
      .map((part: { text: string }) => part.text)
      .join('\n');

    // Extract grounding metadata
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((chunk: { web?: { uri: string; title: string } }) => ({
      url: chunk.web?.uri,
      title: chunk.web?.title,
    })).filter((source: { url?: string }) => source.url) || [];

    // Parse the JSON response
    let sentimentData: SentimentData;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = textResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      sentimentData = JSON.parse(cleanedResponse);
      sentimentData.sources = sources;
    } catch {
      // If JSON parsing fails, create a default response
      console.error('Failed to parse sentiment JSON:', textResponse);
      sentimentData = {
        overall: { positive: 33, negative: 33, neutral: 34 },
        score: 0,
        summary: textResponse.slice(0, 300),
        keyTopics: [],
        recentMentions: [],
        concerns: [],
        positives: [],
        sources,
      };
    }

    return NextResponse.json(sentimentData);
  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

