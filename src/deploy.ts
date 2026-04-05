import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

async function deployCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('[Deploy] ERROR: DISCORD_TOKEN and DISCORD_CLIENT_ID must be set in secrets.');
    process.exit(1);
  }

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

  const commands = commandModules.map(mod => mod.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`[Deploy] Registering ${commands.length} application commands globally...`);

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    ) as unknown[];

    console.log(`[Deploy] Successfully registered ${data.length} application command(s)!`);
    commands.forEach(cmd => console.log(`  ✅ /${cmd.name} — ${cmd.description}`));
  } catch (error) {
    console.error('[Deploy] Failed to register commands:', error);
    process.exit(1);
  }
}

deployCommands();
