import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createNowPlayingEmbed, createInfoEmbed } from '../utils/embeds';
import { createMusicButtons } from '../utils/buttons';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Show the currently playing song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  const track = player?.getCurrentTrack();

  if (!track) {
    await interaction.editReply({
      embeds: [createInfoEmbed('🎵 Nothing Playing', 'Use `/play` to start!')],
    });
    return;
  }

  await interaction.editReply({
    embeds: [createNowPlayingEmbed(track, player!)],
    components: [createMusicButtons(player!)],
  });
}
