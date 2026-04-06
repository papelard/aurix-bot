import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embeds';
import type { RepeatMode } from '../player/types';

export const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Set the loop mode')
  .addStringOption(option =>
    option
      .setName('mode')
      .setDescription('Choose a loop mode')
      .setRequired(true)
      .addChoices(
        { name: '🔂 Track — Loop current song', value: 'track' },
        { name: '🔁 Queue — Loop entire queue', value: 'queue' },
        { name: '❌ Off — Disable loop', value: 'off' },
      ),
  );

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

  const mode = interaction.options.getString('mode', true) as RepeatMode;

  const labels: Record<RepeatMode, { label: string; desc: string }> = {
    track: { label: '🔂 Track Loop', desc: 'The current song will repeat.' },
    queue: { label: '🔁 Queue Loop', desc: 'The entire queue will repeat when it ends.' },
    off: { label: '❌ Loop Off', desc: 'Looping is now disabled.' },
  };

  player.setRepeatMode(mode);
  const { label, desc } = labels[mode];

  await interaction.editReply({ embeds: [createSuccessEmbed(label, desc)] });
}
