import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createNowPlayingEmbed, createErrorEmbed } from '../utils/embeds';
import { createMusicButtons } from '../utils/buttons';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resume the paused song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  if (!player) {
    await interaction.editReply({ embeds: [createErrorEmbed('No music in queue!')] });
    return;
  }

  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.editReply({ embeds: [createErrorEmbed('You need to be in a voice channel!')] });
    return;
  }

  if (!player.isPaused()) {
    await interaction.editReply({ embeds: [createErrorEmbed('Music is already playing!')] });
    return;
  }

  player.resume();
  const track = player.getCurrentTrack();
  if (track) {
    const embed = createNowPlayingEmbed(track, player);
    embed.setAuthor({ name: '▶️ Resumed — Aurix' });
    await interaction.editReply({ embeds: [embed], components: [createMusicButtons(player)] });
  } else {
    await interaction.editReply({ embeds: [createErrorEmbed('Nothing to resume.')] });
  }
}
