import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return null;
  openaiClient = new OpenAI({ baseURL, apiKey });
  return openaiClient;
}

export interface MusicSuggestion {
  query: string;
  reason: string;
}

export async function getSongSuggestionForChannel(channelName: string): Promise<MusicSuggestion> {
  const client = getOpenAIClient();

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-5-mini',
        max_completion_tokens: 150,
        messages: [
          {
            role: 'system',
            content: `You are a music DJ for Discord. Given a voice channel name, suggest ONE specific song to search on YouTube.
            
Rules:
- Return a SHORT, SPECIFIC search query — artist name + song title only (e.g. "Kendrick Lamar Not Like Us")
- NO words like "playlist", "mix", "compilation", "hits", "best of"  
- Match the vibe: gaming→epic/electronic, study/lofi→lofi beats, party→EDM/hiphop, late night→chill/lofi, anime→anime OST

Return JSON only: {"query": "Artist Name Song Title", "reason": "one sentence why"}`,
          },
          {
            role: 'user',
            content: `Voice channel name: "${channelName}"`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        const parsed = JSON.parse(content) as MusicSuggestion;
        if (parsed.query && !parsed.query.toLowerCase().includes('playlist')) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('[AI Music Selector] Error:', err);
    }
  }

  return getRuleBasedSuggestion(channelName.toLowerCase());
}

function getRuleBasedSuggestion(channelName: string): MusicSuggestion {
  if (/gaming|game|pvp|raid|fps|war|battle|arena|ranked/.test(channelName)) {
    return { query: 'Hans Zimmer Time Inception', reason: '🎮 Epic gaming vibes!' };
  }
  if (/lofi|lo-fi|chill|relax|calm/.test(channelName)) {
    return { query: 'Joji Glimpse of Us', reason: '😌 Chill vibes incoming!' };
  }
  if (/study|homework|focus|work|grind/.test(channelName)) {
    return { query: 'Nujabes Feather', reason: '📚 Study music activated!' };
  }
  if (/party|hype|club|dance|lit/.test(channelName)) {
    return { query: 'Martin Garrix Animals', reason: '🎉 Party time!' };
  }
  if (/late|night|midnight|insomnia/.test(channelName)) {
    return { query: 'Jorja Smith Blue Lights', reason: '🌙 Late night vibes!' };
  }
  if (/anime|weeb|otaku|japan/.test(channelName)) {
    return { query: 'Gurenge LiSA Demon Slayer', reason: '🇯🇵 Anime mode!' };
  }
  return { query: 'Kendrick Lamar Not Like Us', reason: '🎵 Something good for everyone!' };
}
