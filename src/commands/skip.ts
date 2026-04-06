import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  if (!player || !player.isActive()) {
    await interaction.editReply({ embeds: [createErrorEmbed('No music is playing right now!')] });
    return;
  }

  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.editReply({ embeds: [createErrorEmbed('You need to be in a voice channel!')] });
    return;
  }

  const skipped = player.getCurrentTrack();
  player.skip();

  await interaction.editReply({
    embeds: [createSuccessEmbed('Skipped!', `Skipped **${skipped?.title ?? 'current track'}**.`)],
  });
}
