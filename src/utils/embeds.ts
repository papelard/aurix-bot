import { EmbedBuilder } from 'discord.js';
import type { QueueTrack } from '../player/types';
import type { GuildPlayer } from '../player/GuildPlayer';

const BRAND_COLOR = 0x7c3aed as const;

function formatProgress(elapsed: number, total: number): string {
  const pct = total > 0 ? Math.min(elapsed / total, 1) : 0;
  const filled = Math.round(pct * 20);
  const empty = 20 - filled;
  const bar = '▬'.repeat(filled) + '🔘' + '▬'.repeat(empty);
  return `\`${fmtTime(elapsed)}\` ${bar} \`${fmtTime(total)}\``;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function createNowPlayingEmbed(track: QueueTrack, player: GuildPlayer): EmbedBuilder {
  const elapsed = player.getElapsedSeconds();
  const progress = formatProgress(elapsed, track.durationInSec);

  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: '🎵 Now Playing — Aurix' })
    .setTitle(track.title)
    .setURL(track.url)
    .setThumbnail(track.thumbnail || null)
    .setDescription(progress)
    .addFields(
      { name: '👤 Artist', value: track.author || 'Unknown', inline: true },
      { name: '⏱️ Duration', value: track.duration || 'Unknown', inline: true },
      { name: '📋 In Queue', value: `${player.getQueueSize()} track(s)`, inline: true },
      { name: '👋 Requested by', value: track.requestedBy.toString(), inline: true },
    )
    .setFooter({ text: 'Aurix | /help for commands' });
}

export function createQueueEmbed(player: GuildPlayer): EmbedBuilder {
  const currentTrack = player.getCurrentTrack();
  const tracks = player.getQueue().slice(0, 15);
  const total = player.getQueueSize();

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('📋 Music Queue — Aurix')
    .setFooter({ text: `${total} track(s) in queue | Loop: ${player.getRepeatMode()}` });

  if (currentTrack) {
    embed.addFields({
      name: '🎵 Currently Playing',
      value: `**[${currentTrack.title}](${currentTrack.url})** — \`${currentTrack.duration}\` | ${currentTrack.requestedBy.toString()}`,
    });
  }

  if (tracks.length > 0) {
    const list = tracks
      .map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) — \`${t.duration}\` | ${t.requestedBy.toString()}`)
      .join('\n');
    embed.addFields({ name: '📜 Up Next', value: list.slice(0, 1024) });
  }

  if (!currentTrack && tracks.length === 0) {
    embed.setDescription('The queue is empty. Use `/play` to add some music!');
  }

  return embed;
}

export function createTrackAddedEmbed(track: QueueTrack, position: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: '🎶 Added to Queue' })
    .setTitle(track.title)
    .setURL(track.url)
    .setThumbnail(track.thumbnail || null)
    .addFields(
      { name: '👤 Artist', value: track.author || 'Unknown', inline: true },
      { name: '⏱️ Duration', value: track.duration || 'Unknown', inline: true },
      { name: '📋 Position', value: `#${position}`, inline: true },
    )
    .setFooter({ text: 'Aurix' });
}

export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setFooter({ text: 'Aurix' });
}

export function createErrorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle('❌ Error')
    .setDescription(description)
    .setFooter({ text: 'Aurix' });
}

export function createInfoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'Aurix' });
}
