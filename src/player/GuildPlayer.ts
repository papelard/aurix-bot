import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  StreamType,
  type AudioPlayer,
  type VoiceConnection,
} from '@discordjs/voice';
import type { VoiceBasedChannel, TextChannel } from 'discord.js';
import { getStreamUrl } from '../utils/youtube';
import type { QueueTrack, RepeatMode } from './types';

export class GuildPlayer {
  private queue: QueueTrack[] = [];
  private _currentTrack: QueueTrack | null = null;
  private audioPlayer: AudioPlayer;
  private connection: VoiceConnection | null = null;
  private _textChannel: TextChannel;
  private _repeatMode: RepeatMode = 'off';
  private guildId: string;
  private startedAt: number | null = null;

  constructor(guildId: string, textChannel: TextChannel) {
    this.guildId = guildId;
    this._textChannel = textChannel;
    this.audioPlayer = createAudioPlayer();

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.handleTrackEnd();
    });

    this.audioPlayer.on('error', (error) => {
      console.error(`[GuildPlayer:${guildId}] Audio error: ${error.message}`);
      this._textChannel
        .send(`❌ Failed to play **${this._currentTrack?.title ?? 'track'}** — skipping...`)
        .catch(console.error);
      this.handleTrackEnd();
    });
  }

  async connect(channel: VoiceBasedChannel): Promise<void> {
    const existing = getVoiceConnection(this.guildId);

    if (existing) {
      if (existing.state.status === VoiceConnectionStatus.Ready) {
        // Already connected and ready — reuse
        this.connection = existing;
        this.connection.subscribe(this.audioPlayer);
        return;
      }
      // Stale / broken connection — destroy and reconnect
      existing.destroy();
    }

    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    this.connection.subscribe(this.audioPlayer);

    // Handle surprise disconnects
    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.connection?.destroy();
        this.connection = null;
      }
    });

    await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    console.log(`[GuildPlayer:${this.guildId}] Voice connection ready`);
  }

  addTrack(track: QueueTrack): void {
    this.queue.push(track);
  }

  async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this._currentTrack = null;
      this.startedAt = null;
      this._textChannel
        .send('✅ Queue finished! Use `/play` to add more songs. 🎵')
        .catch(console.error);
      return;
    }

    const track = this.queue.shift()!;
    this._currentTrack = track;

    try {
      console.log(`[GuildPlayer:${this.guildId}] Playing: ${track.title} (${track.videoId})`);

      // getStreamUrl returns a deciphered YouTube URL — pass directly to ffmpeg.
      // ffmpeg handles the HTTP fetch; no need to pipe a Node stream ourselves.
      const streamUrl = await getStreamUrl(track.videoId);

      const resource = createAudioResource(streamUrl, {
        inputType: StreamType.Arbitrary,
      });

      this.startedAt = Date.now();
      this.audioPlayer.play(resource);
    } catch (error) {
      console.error(`[GuildPlayer:${this.guildId}] Stream error:`, error);
      this._textChannel
        .send(`❌ Could not stream **${track.title}** — skipping...`)
        .catch(console.error);
      this.handleTrackEnd();
    }
  }

  private handleTrackEnd(): void {
    if (this._repeatMode === 'track' && this._currentTrack) {
      this.queue.unshift(this._currentTrack);
    } else if (this._repeatMode === 'queue' && this._currentTrack) {
      this.queue.push(this._currentTrack);
    }
    this.playNext();
  }

  skip(): boolean {
    if (!this._currentTrack) return false;
    this.audioPlayer.stop(true);
    return true;
  }

  stop(): void {
    this.queue = [];
    this._currentTrack = null;
    this.startedAt = null;
    this.audioPlayer.stop(true);
    this.connection?.destroy();
    this.connection = null;
  }

  pause(): boolean {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Playing) return false;
    return this.audioPlayer.pause();
  }

  resume(): boolean {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Paused) return false;
    return this.audioPlayer.unpause();
  }

  shuffle(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  setRepeatMode(mode: RepeatMode): void {
    this._repeatMode = mode;
  }

  getRepeatMode(): RepeatMode {
    return this._repeatMode;
  }

  getCurrentTrack(): QueueTrack | null {
    return this._currentTrack;
  }

  getQueue(): QueueTrack[] {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isActive(): boolean {
    const s = this.audioPlayer.state.status;
    return s === AudioPlayerStatus.Playing || s === AudioPlayerStatus.Paused;
  }

  isPaused(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
  }

  setTextChannel(channel: TextChannel): void {
    this._textChannel = channel;
  }

  getElapsedSeconds(): number {
    if (!this.startedAt) return 0;
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }
}
