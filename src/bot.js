import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

import {
    addUserToGame, assignStartRoles
} from "../commands/handlers/database-handlers.js";

import {
    ping
} from '../commands/ping.js';

import {
    start
} from '../commands/start.js';
import gameEvents from "../commands/emitters/emitter.js";
import gameState from "./gameState.js";

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
        await start(interaction, client);
    }

    if (interaction.customId === 'join_game') {
        console.log(`User ID: ${interaction.user.id} joined the game.`);
        await interaction.reply({ content: `You have joined the game!`, ephemeral: true });

        await addUserToGame(interaction)

    }
});

// Listen for stage updates
gameEvents.on('stageUpdate', async (data) => {
    console.log(`Stage updated for game ${data.gameId} to ${data.currentStage}`);

    const gameId = data.gameId;
    const stage = data.currentStage;

    console.log(data.currentDay)
    console.log('blahblahbla4')
    // if the stage is 0 and the day is 0 then it is the start of the game
    if (stage === 1 && data.currentDay === 0) {
        const gameInfo = {
            roles: {

            }, // Initially empty, will be filled with roles
            // ...other game-related info
        };
        // Initialize the game with no roles assigned yet
        await gameState.setGame(gameId, gameInfo);


        await assignStartRoles(gameId);
        console.log('blahblahblah')
        console.log('blahblahblah -2343534535')
    }

});

// Listen for day updates
gameEvents.on('dayUpdate', (data) => {
    console.log(`Day updated for game ${data.gameId} to ${data.currentDay}`);
    // Handle the day update (e.g., notify players, update the database)
});

client.login(botToken);