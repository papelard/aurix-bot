import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds';
import { createDisabledButtons } from '../utils/buttons';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop playback, clear the queue, and disconnect');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  if (!player) {
    await interaction.editReply({ embeds: [createErrorEmbed('No music is playing right now!')] });
    return;
  }

  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.editReply({ embeds: [createErrorEmbed('You need to be in a voice channel!')] });
    return;
  }

  const queueSize = player.getQueueSize() + (player.getCurrentTrack() ? 1 : 0);
  musicManager.delete(interaction.guild.id);

  await interaction.editReply({
    embeds: [createSuccessEmbed('Stopped!', `Stopped playback and cleared **${queueSize}** track(s). Goodbye! 👋`)],
    components: [createDisabledButtons()],
  });
}
