import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { GuildPlayer } from '../player/GuildPlayer';

export function createMusicButtons(player: GuildPlayer): ActionRowBuilder<ButtonBuilder> {
  const isPaused = player.isPaused();

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(isPaused ? 'resume' : 'pause')
      .setLabel(isPaused ? '▶️ Resume' : '⏸️ Pause')
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('skip')
      .setLabel('⏭️ Skip')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('shuffle')
      .setLabel('🔀 Shuffle')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('stop')
      .setLabel('⏹️ Stop')
      .setStyle(ButtonStyle.Danger),
  );
}

export function createDisabledButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('pause_d')
      .setLabel('⏸️ Pause')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('skip_d')
      .setLabel('⏭️ Skip')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('shuffle_d')
      .setLabel('🔀 Shuffle')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('stop_d')
      .setLabel('⏹️ Stop')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
  );
}
