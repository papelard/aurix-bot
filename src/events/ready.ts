import type { Client } from 'discord.js';

export function handleReady(client: Client): void {
  client.once('ready', (readyClient) => {
    console.log(`[Aurix] Logged in as ${readyClient.user.tag}`);
    console.log(`[Aurix] Serving ${readyClient.guilds.cache.size} guild(s)`);
    readyClient.user.setActivity({ name: '/play • Aurix 🎵' });
  });
}
