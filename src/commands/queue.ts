import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createQueueEmbed, createInfoEmbed } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('View the current music queue');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  if (!player || (!player.getCurrentTrack() && player.getQueueSize() === 0)) {
    await interaction.editReply({
      embeds: [createInfoEmbed('📋 Queue is Empty', 'Use `/play` to start playing!')],
    });
    return;
  }

  await interaction.editReply({ embeds: [createQueueEmbed(player)] });
}
