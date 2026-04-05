import { Client, Collection, GatewayIntentBits } from 'discord.js';
import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

// Ensure ffmpeg is discoverable
function resolveFfmpeg(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegStatic = require('ffmpeg-static') as string | null;
    if (ffmpegStatic) {
      process.env.FFMPEG_PATH = ffmpegStatic;
      console.log(`[Aurix] ffmpeg: ${ffmpegStatic}`);
      return;
    }
  } catch { /* fall through */ }

  try {
    const sys = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    if (sys) {
      process.env.FFMPEG_PATH = sys;
      console.log(`[Aurix] ffmpeg (system): ${sys}`);
    }
  } catch {
    console.warn('[Aurix] WARNING: ffmpeg not found!');
  }
}

resolveFfmpeg();

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

async function main() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('[Aurix] ERROR: DISCORD_TOKEN not set.');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
    ],
  });

  const commands = new Collection<string, Command>();

  const commandModules = [
    await import('./commands/play'),
    await import('./commands/skip'),
    await import('./commands/stop'),
    await import('./commands/pause'),
    await import('./commands/resume'),
    await import('./commands/queue'),
    await import('./commands/nowplaying'),
    await import('./commands/shuffle'),
    await import('./commands/loop'),
  ];

  for (const mod of commandModules) {
    commands.set(mod.data.name, mod as unknown as Command);
  }

  console.log(`[Aurix] Loaded ${commands.size} commands.`);

  const { handleReady } = await import('./events/ready');
  const { handleInteractionCreate } = await import('./events/interactionCreate');

  handleReady(client);
  handleInteractionCreate(client, commands);

  await client.login(token);
}

main().catch((err) => {
  console.error('[Aurix] Fatal error:', err);
  process.exit(1);
});
