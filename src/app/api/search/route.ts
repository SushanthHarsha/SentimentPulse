import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const MODEL = 'gemini-3.8-flash';

async function searchWeb(query: string) {
  if (!TAVILY_API_KEY) throw new Error('TAVILY_API_KEY is not configured');
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      topic: 'news',
      search_depth: 'advanced',
      max_results: 8,
      include_answer: false,
      include_raw_content: false
    }),
    cache: 'no-store'
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('Tavily search error:', detail);
    throw new Error(`Web search failed (${response.status})`);
  }
  const data = await response.json();
  return (data.results || []).map((item: any) => ({
    title: item.title || 'Untitled source',
    url: item.url,
    content: item.content || '',
    published_date: item.published_date || null
  })).filter((item: any) => item.url);
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY || !TAVILY_API_KEY) {
      return NextResponse.json(
        { error: 'Service not configured. Set GEMINI_API_KEY and TAVILY_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 500) : '';
    if (query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters.' }, { status: 400 });
    }

    const results = await searchWeb(query);
    const context = results.map((r: any, i: number) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\nDate: ${r.published_date || 'Not provided'}\n${r.content}`
    ).join('\n\n');

    const prompt = `Answer the user's question using only the supplied web search results where possible. Clearly distinguish sourced facts from uncertainty. Do not invent facts or citations.\n\nQuestion: ${query}\n\nCurrent web search results:\n${context}\n\nGive a concise, useful answer and refer to sources by their numbered labels.`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
        }),
        cache: 'no-store'
      }
    );
    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error('Gemini API error:', detail);
      return NextResponse.json({ error: 'AI response failed', detail }, { status: aiResponse.status });
    }
    const data = await aiResponse.json();
    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map((part: any) => part.text || '').join('\n').trim();

    return NextResponse.json({
      response: answer,
      sources: results.map((r: any) => ({ title: r.title, url: r.url, publishedDate: r.published_date }))
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
