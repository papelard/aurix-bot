import type { User } from 'discord.js';

export interface QueueTrack {
  videoId: string;
  title: string;
  url: string;
  duration: string;
  durationInSec: number;
  thumbnail: string;
  author: string;
  requestedBy: User;
}

export type RepeatMode = 'off' | 'track' | 'queue';
