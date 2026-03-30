import { getCached, setCache } from '../cache';
import { Position } from '../types';
import * as cheerio from 'cheerio';

const TOPICS = ['Israel', 'Taxes', 'Abortion', 'Religion', 'Affordable Housing'];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Israel': ['israel', 'gaza', 'palestinian', 'hamas', 'middle east'],
  'Taxes': ['tax', 'taxation', 'irs', 'income tax', 'tax cut'],
  'Abortion': ['abort', 'pro-life', 'pro-choice', 'reproductive', 'roe'],
  'Religion': ['religio', 'faith', 'church', 'prayer', 'christian'],
  'Affordable Housing': ['housing', 'rent', 'homeless', 'affordable hous', 'hud'],
};

export async function getPositions(politicianName: string): Promise<Position[]> {
  const cacheKey = `positions:${politicianName}`;
  const cached = getCached<Position[]>(cacheKey);
  if (cached) return cached;

  try {
    const nameParts = politicianName.replace(/[^a-zA-Z ]/g, '').trim().split(/\s+/);
    if (nameParts.length < 2) return [];

    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const urlName = `${firstName}_${lastName}`;

    const res = await fetch(`https://www.ontheissues.org/${urlName}.htm`, {
      headers: { 'User-Agent': 'Polinear/1.0 (Political Education App)' },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const page = cheerio.load(html);

    const positions: Position[] = [];
    const bodyText = page('body').text();

    for (const topic of TOPICS) {
      const keywords = TOPIC_KEYWORDS[topic];
      const allText = bodyText.replace(/\s+/g, ' ');
      const textSentences = allText.split(/[.!?]+/);

      for (const sentence of textSentences) {
        const lower = sentence.toLowerCase();
        if (keywords.some(kw => lower.includes(kw))) {
          const trimmed = sentence.trim();
          if (trimmed.length > 20 && trimmed.length < 300) {
            positions.push({
              topic,
              stance: trimmed + '.',
              citation: 'OnTheIssues.org',
              sourceUrl: `https://www.ontheissues.org/${urlName}.htm`,
            });
            break;
          }
        }
      }
    }

    setCache(cacheKey, positions, 86400 * 7);
    return positions;
  } catch (err) {
    console.error('OnTheIssues scraper error:', err);
    return [];
  }
}

export { TOPICS };
