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

import {
    createPrivateChannelForUsers
} from "../commands/handlers/privateChannel-handlers.js";

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
    const guild = client.guilds.cache.get('1174666167227531345');
    console.log(`Stage updated for game ${data.gameId} to ${data.currentStage}`);

    const gameId = data.gameId;
    const stage = data.currentStage;

    // if the stage is 0 and the day is 0 then it is the start of the game
    if (stage === 1 && data.currentDay === 0) {
        const gameInfo = {
            roles: {

            },
        };
        // Initialize the game with no roles assigned yet
        await gameState.setGame(gameId, gameInfo);
        await assignStartRoles(gameId);

        const mafiaUserIds = await gameState.getUsersByRole(gameId, 'mafia');
        const mafiaChannel = await createPrivateChannelForUsers(guild, '🔪⡇mafia-only', mafiaUserIds);

     //  const detectiveChannel = await createPrivateChannelForUsers(guild, 'Detective Channel', [detectiveUserId]);
     //  const doctorChannel = await createPrivateChannelForUsers(guild, 'Doctor Channel', [doctorUserId]);
    }

});

// Listen for day updates
gameEvents.on('dayUpdate', (data) => {
    console.log(`Day updated for game ${data.gameId} to ${data.currentDay}`);
    // Handle the day update (e.g., notify players, update the database)
});

client.login(botToken);