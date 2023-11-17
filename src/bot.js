import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

import {
    ping
} from '../commands/ping.js';

import {
    start
} from '../commands/start.js';

// get the token from the .env file using dotenv
config();
const botToken = process.env.DISCORD_TOKEN;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {

    if (interaction.commandName === 'ping') {
        await ping(interaction);
    }

    if (interaction.commandName === 'start') {
        await start(interaction);
    }

    if (interaction.customId === 'join_game') {
        console.log(`User ID: ${interaction.user.id} joined the game.`);
        await interaction.reply({ content: `You have joined the game!`, ephemeral: true });
    }
});

client.login(botToken);