import {
  Client,
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  GuildMember,
} from 'discord.js';
import { musicManager } from '../player/MusicManager';
import { createNowPlayingEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/embeds';
import { createMusicButtons } from '../utils/buttons';
import type { Command } from '../index';

export function handleInteractionCreate(client: Client, commands: Map<string, Command>): void {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction, commands);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    }
  });
}

async function handleCommand(
  interaction: ChatInputCommandInteraction,
  commands: Map<string, Command>,
): Promise<void> {
  const command = commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unknown command!', ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Command: /${interaction.commandName}]`, error);
    const msg = { embeds: [createErrorEmbed('An error occurred running this command.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild) return;

  const player = musicManager.get(interaction.guild.id);
  const customId = interaction.customId;

  // Ignore disabled placeholder buttons
  if (customId.endsWith('_d')) {
    await interaction.deferUpdate();
    return;
  }

  if (!player) {
    await interaction.reply({ embeds: [createErrorEmbed('No music is playing!')], ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  if (!member.voice.channel) {
    await interaction.reply({ embeds: [createErrorEmbed('You need to be in a voice channel!')], ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  try {
    switch (customId) {
      case 'pause': {
        player.pause();
        const track = player.getCurrentTrack();
        if (track) {
          const embed = createNowPlayingEmbed(track, player);
          embed.setAuthor({ name: '⏸️ Paused — Aurix' }).setColor(0xf59e0b);
          await interaction.editReply({ embeds: [embed], components: [createMusicButtons(player)] });
        }
        break;
      }

      case 'resume': {
        player.resume();
        const track = player.getCurrentTrack();
        if (track) {
          const embed = createNowPlayingEmbed(track, player);
          embed.setAuthor({ name: '▶️ Resumed — Aurix' });
          await interaction.editReply({ embeds: [embed], components: [createMusicButtons(player)] });
        }
        break;
      }

      case 'skip': {
        const skipped = player.getCurrentTrack();
        player.skip();
        await interaction.editReply({
          embeds: [createSuccessEmbed('Skipped!', `Skipped **${skipped?.title ?? 'track'}**.`)],
          components: [],
        });
        break;
      }

      case 'shuffle': {
        if (player.getQueueSize() > 0) {
          player.shuffle();
          const track = player.getCurrentTrack();
          if (track) {
            const embed = createNowPlayingEmbed(track, player);
            embed.setAuthor({ name: '🔀 Queue Shuffled! — Aurix' });
            await interaction.editReply({ embeds: [embed], components: [createMusicButtons(player)] });
          }
        }
        break;
      }

      case 'stop': {
        musicManager.delete(interaction.guild.id);
        await interaction.editReply({
          embeds: [createSuccessEmbed('Stopped!', 'Playback stopped and queue cleared. Goodbye! 👋')],
          components: [],
        });
        break;
      }
    }
  } catch (error) {
    console.error(`[Button: ${customId}]`, error);
  }
}
