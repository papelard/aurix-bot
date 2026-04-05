import type { TextChannel } from 'discord.js';
import { GuildPlayer } from './GuildPlayer';

class MusicManager {
  private players = new Map<string, GuildPlayer>();

  get(guildId: string): GuildPlayer | null {
    return this.players.get(guildId) ?? null;
  }

  getOrCreate(guildId: string, textChannel: TextChannel): GuildPlayer {
    const existing = this.players.get(guildId);
    if (existing) {
      existing.setTextChannel(textChannel);
      return existing;
    }
    const player = new GuildPlayer(guildId, textChannel);
    this.players.set(guildId, player);
    return player;
  }

  delete(guildId: string): void {
    const player = this.players.get(guildId);
    if (player) {
      player.stop();
      this.players.delete(guildId);
    }
  }
}

export const musicManager = new MusicManager();
