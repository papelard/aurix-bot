import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Shuffle the current queue');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  if (!player || player.getQueueSize() === 0) {
    await interaction.editReply({ embeds: [createErrorEmbed('Not enough tracks in the queue to shuffle!')] });
    return;
  }

  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.editReply({ embeds: [createErrorEmbed('You need to be in a voice channel!')] });
    return;
  }

  player.shuffle();

  await interaction.editReply({
    embeds: [createSuccessEmbed('🔀 Shuffled!', `Shuffled **${player.getQueueSize()}** tracks. Use \`/queue\` to see the new order!`)],
  });
}
