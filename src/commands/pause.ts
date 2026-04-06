import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createNowPlayingEmbed, createErrorEmbed } from '../utils/embeds';
import { createMusicButtons } from '../utils/buttons';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the current song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  if (!player || !player.isActive()) {
    await interaction.editReply({ embeds: [createErrorEmbed('No music is playing!')] });
    return;
  }

  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.editReply({ embeds: [createErrorEmbed('You need to be in a voice channel!')] });
    return;
  }

  if (player.isPaused()) {
    await interaction.editReply({ embeds: [createErrorEmbed('Already paused! Use `/resume` to continue.')] });
    return;
  }

  player.pause();
  const track = player.getCurrentTrack();
  if (track) {
    const embed = createNowPlayingEmbed(track, player);
    embed.setAuthor({ name: '⏸️ Paused — Aurix' }).setColor(0xf59e0b);
    await interaction.editReply({ embeds: [embed], components: [createMusicButtons(player)] });
  } else {
    await interaction.editReply({ embeds: [{ title: '⏸️ Paused', description: 'Use `/resume` to continue.' } as any] });
  }
}
