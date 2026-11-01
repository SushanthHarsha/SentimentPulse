import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const MODEL = 'gemini-3.8-flash';

interface SentimentData {
  overall: { positive: number; negative: number; neutral: number };
  score: number;
  summary: string;
  keyTopics: { topic: string; sentiment: 'positive' | 'negative' | 'neutral'; mentions: number }[];
  recentMentions: { text: string; sentiment: 'positive' | 'negative' | 'neutral'; source: string }[];
  concerns: string[];
  positives: string[];
  sources: { url: string; title: string }[];
}

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
      max_results: 10,
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
        { error: 'Service not configured. Set GEMINI_API_KEY and TAVILY_API_KEY in Vercel.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const policy = typeof body.policy === 'string' ? body.policy.trim().slice(0, 200) : '';
    if (policy.length < 2) {
      return NextResponse.json({ error: 'Policy name must be at least 2 characters.' }, { status: 400 });
    }

    // Fetch fresh web results for every analysis; this is search-based sentiment, not a representative poll.
    const results = await searchWeb(`Latest news, public reactions and discussion in India about ${policy}`);
    if (!results.length) {
      return NextResponse.json({ error: 'No recent web results were found. Try a more specific policy name.' }, { status: 404 });
    }

    const sourceContext = results.map((r: any, i: number) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\nPublished: ${r.published_date || 'Date not supplied'}\nSearch excerpt: ${r.content}`
    ).join('\n\n');

    const prompt = `You are analysing public sentiment using fresh web search results. Analyse the current public discussion in India about: "${policy}".

IMPORTANT:
- Base the analysis only on the supplied search results. Do not pretend these are a representative survey or live social-media firehose.
- Do not invent quotes, individual opinions, mention counts, dates, or sources.
- Treat sentiment percentages and topic mention counts as rough estimates from this limited sample, not population polling.
- recentMentions must be concise paraphrases of actual supplied source content, not fabricated direct quotes. In "source", use the publisher/source type supported by the URL/title.
- Percentages must total exactly 100.
- Return ONLY valid JSON, with no Markdown fences, matching this schema:
{
  "overall": {"positive": 0, "negative": 0, "neutral": 0},
  "score": 0,
  "summary": "2-3 sentence summary including that this is a web-sample snapshot",
  "keyTopics": [{"topic": "topic", "sentiment": "positive", "mentions": 1}],
  "recentMentions": [{"text": "faithful paraphrase", "sentiment": "neutral", "source": "News"}],
  "concerns": ["concern"],
  "positives": ["positive aspect"]
}

Provide 5-7 keyTopics, up to 6 recentMentions, and 3-5 concerns/positives where supported. Use fewer rather than inventing information.

Fresh web search results:
${sourceContext}`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 3000 }
        }),
        cache: 'no-store'
      }
    );

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error('Gemini API error:', detail);
      return NextResponse.json({ error: 'Gemini analysis failed', detail }, { status: aiResponse.status });
    }

    const data = await aiResponse.json();
    const textResponse = (data.candidates?.[0]?.content?.parts || [])
      .map((part: any) => part.text || '').join('\n').trim();
    const cleaned = textResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let sentimentData: SentimentData;
    try {
      sentimentData = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini JSON:', textResponse);
      return NextResponse.json({ error: 'The AI returned an unreadable analysis. Please try again.' }, { status: 502 });
    }

    const clamp = (n: unknown) => Math.max(0, Math.min(100, Number(n) || 0));
    sentimentData.overall = {
      positive: clamp(sentimentData.overall?.positive),
      negative: clamp(sentimentData.overall?.negative),
      neutral: clamp(sentimentData.overall?.neutral)
    };
    const total = sentimentData.overall.positive + sentimentData.overall.negative + sentimentData.overall.neutral;
    if (total > 0) {
      sentimentData.overall.positive = Math.round(sentimentData.overall.positive / total * 100);
      sentimentData.overall.negative = Math.round(sentimentData.overall.negative / total * 100);
      sentimentData.overall.neutral = 100 - sentimentData.overall.positive - sentimentData.overall.negative;
    }
    sentimentData.score = Math.max(-100, Math.min(100, Number(sentimentData.score) || 0));
    sentimentData.sources = results.map((r: any) => ({ url: r.url, title: r.title }));
    return NextResponse.json(sentimentData);
  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
