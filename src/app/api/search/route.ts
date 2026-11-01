import { NextRequest, NextResponse } from 'next/server';

// Environment variable validation - API key must be set in production
const API_KEY = process.env.GEMINI_API_KEY;

// Rate limiting: simple in-memory store (use Redis in production for multiple instances)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15; // 15 requests per minute

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

    const { query } = await request.json();

    // Input validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Sanitize and limit input length
    const sanitizedQuery = query.trim().slice(0, 500);
    
    if (sanitizedQuery.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

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
              parts: [{ text: sanitizedQuery }],
            },
          ],
          tools: [
            {
              google_search: {},
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini' },
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

    // Extract grounding metadata if available
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((chunk: { web?: { uri: string; title: string } }) => ({
      url: chunk.web?.uri,
      title: chunk.web?.title,
    })).filter((source: { url?: string }) => source.url) || [];

    return NextResponse.json({
      response: textResponse,
      sources,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

