import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { musicManager } from '../player/MusicManager';
import type { QueueTrack } from '../player/types';
import { searchYouTube, getVideoInfo } from '../utils/youtube';
import { createNowPlayingEmbed, createTrackAddedEmbed, createErrorEmbed, createInfoEmbed } from '../utils/embeds';
import { createMusicButtons } from '../utils/buttons';
import { getSongSuggestionForChannel } from '../utils/aiMusicSelector';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song, or let AI pick based on your channel name!')
  .addStringOption(option =>
    option
      .setName('query')
      .setDescription('Song name or YouTube URL (leave empty for AI selection)')
      .setRequired(false),
  );

const YT_URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.editReply({ embeds: [createErrorEmbed('You need to be in a voice channel first!')] });
    return;
  }

  if (!interaction.guild) {
    await interaction.editReply({ embeds: [createErrorEmbed('Server-only command.')] });
    return;
  }

  let query = interaction.options.getString('query');
  let aiPowered = false;
  let aiReason = '';

  // AI mode when no query provided
  if (!query) {
    aiPowered = true;
    await interaction.editReply({
      embeds: [createInfoEmbed('🤖 AI Picking Music...', `Analyzing **#${voiceChannel.name}** for the perfect vibe...`)],
    });
    const suggestion = await getSongSuggestionForChannel(voiceChannel.name);
    query = suggestion.query;
    aiReason = suggestion.reason;
  }

  try {
    let track: QueueTrack;

    // Check for YouTube URL
    const ytMatch = YT_URL_RE.exec(query!);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const info = await getVideoInfo(videoId);
      if (!info) {
        await interaction.editReply({ embeds: [createErrorEmbed('Could not fetch info for that video.')] });
        return;
      }
      track = { ...info, requestedBy: interaction.user };
    } else {
      // Text search via youtubei.js
      const results = await searchYouTube(query!, 5);
      if (!results.length) {
        await interaction.editReply({
          embeds: [createErrorEmbed(`No results found for: \`${query}\`\nTry a different song name!`)],
        });
        return;
      }
      const video = results[0];
      track = { ...video, requestedBy: interaction.user };
    }

    const guildPlayer = musicManager.getOrCreate(
      interaction.guild.id,
      interaction.channel as TextChannel,
    );

    await guildPlayer.connect(voiceChannel);

    const wasActive = guildPlayer.isActive();
    guildPlayer.addTrack(track);

    if (!wasActive) {
      await guildPlayer.playNext();
      const embed = createNowPlayingEmbed(track, guildPlayer);
      if (aiPowered) embed.setFooter({ text: `🤖 AI-selected: ${aiReason} | Aurix` });
      await interaction.editReply({
        embeds: [embed],
        components: [createMusicButtons(guildPlayer)],
      });
    } else {
      const embed = createTrackAddedEmbed(track, guildPlayer.getQueueSize());
      if (aiPowered) embed.setAuthor({ name: `🤖 AI Pick — ${aiReason}` });
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('[/play]', error);
    await interaction.editReply({
      embeds: [createErrorEmbed('Something went wrong. Try a different song name or URL!')],
    });
  }
}
