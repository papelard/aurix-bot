import { Innertube } from 'youtubei.js';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  url: string;
  duration: string;
  durationInSec: number;
  thumbnail: string;
  author: string;
}

let yt: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!yt) {
    // Do NOT set generate_session_locally — we need the real player.js from YouTube
    // to decipher streaming URLs. Without it, all download() calls fail.
    yt = await Innertube.create({ cache: false });
    console.log('[YouTube] Innertube client ready');
  }
  return yt;
}

export async function searchYouTube(query: string, limit = 5): Promise<YouTubeVideo[]> {
  const innertube = await getInnertube();
  const results = await innertube.search(query, { type: 'video' });

  const videos: YouTubeVideo[] = [];
  for (const item of results.videos) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = item as any;
    const videoId: string = v.id ?? v.video_id;
    if (!videoId) continue;

    const title: string = (typeof v.title === 'string' ? v.title : v.title?.text) ?? 'Unknown';
    const authorName: string = (typeof v.author === 'string' ? v.author : v.author?.name) ?? 'Unknown';
    const durationText: string = v.duration?.text ?? v.duration_text ?? '0:00';
    const durationSec: number = v.duration?.seconds ?? 0;
    const thumb: string = v.thumbnails?.[0]?.url ?? v.thumbnail?.[0]?.url ?? '';

    videos.push({
      videoId,
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      duration: durationText,
      durationInSec: durationSec,
      thumbnail: thumb,
      author: authorName,
    });

    if (videos.length >= limit) break;
  }

  return videos;
}

export async function getVideoInfo(videoId: string): Promise<YouTubeVideo | null> {
  const innertube = await getInnertube();
  try {
    const info = await innertube.getBasicInfo(videoId);
    const d = info.basic_info;
    return {
      videoId,
      title: d.title ?? 'Unknown',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      duration: formatDuration(d.duration ?? 0),
      durationInSec: d.duration ?? 0,
      thumbnail: d.thumbnail?.[0]?.url ?? '',
      author: d.author ?? 'Unknown',
    };
  } catch {
    return null;
  }
}

/**
 * Returns a deciphered, directly-playable audio URL for the given YouTube video.
 * We pass this URL straight to ffmpeg (via createAudioResource) rather than
 * piping a Node stream — ffmpeg handles the HTTP request, which is more reliable.
 */
export async function getStreamUrl(videoId: string): Promise<string> {
  const innertube = await getInnertube();
  const info = await innertube.getInfo(videoId);

  // Pick best audio-only format
  const format = info.chooseFormat({ quality: 'best', type: 'audio' });
  console.log(`[YouTube] Format: ${format.mime_type}, bitrate: ${format.average_bitrate}`);

  // Decipher the URL using the loaded player.js
  const url = format.decipher(innertube.session.player);
  if (!url) throw new Error('Decipher returned empty URL');

  return url;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
