import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

import {
    addUserToGame, assignStartRoles, sendChannelIdsToDatabase
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
import {narrateAndPlayVoiceLine} from "../commands/handlers/voice-handlers.js";

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
    const guildId = 1174666167227531345
    console.log(`Stage updated for game ${data.gameId} to ${data.currentStage}`);

    const gameId = data.gameId;
    const stage = data.currentStage;

    // day zero || stage 1
    if (stage === 1 && data.currentDay === 0) {
        const gameInfo = {
            roles: {},
        };
        // Initialize the game with no roles assigned yet
        await gameState.setGame(gameId, gameInfo);
        await assignStartRoles(gameId);

        let mafiaChannelId;
        let doctorChannelId;
        let detectiveChannelId;

        const mafiaUserIds = await gameState.getUsersByRole(gameId, 'mafia');
        const mafiaChannel = await createPrivateChannelForUsers(guild, '🔪⡇mafia-only-' + gameId, mafiaUserIds).then(channel => {
            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle('Mafia Channel')
                .setDescription('Welcome to the Mafia Channel! You can talk with your fellow mafia members here.')
                .addFields(
                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                )
                .setImage('https://media.discordapp.net/attachments/978344813374083222/1174832681717071872/start.png?ex=65690732&is=65569232&hm=a03b9233f9b1e29f376630e9c3aff6aae8439b15ee50f32c7e956a510ea53cfe&=&width=1500&height=500')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                });
            channel.send({embeds: [embed]});

            // save the id for later votes in the gamestate
            mafiaChannelId = channel.id;
        })

        const doctorUserId = await gameState.getUsersByRole(gameId, 'doctor');
        const doctorChannel = await createPrivateChannelForUsers(guild, '💊⡇doctor-only-' + gameId, doctorUserId).then(channel => {
            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle('Mafia Channel')
                .setDescription('Welcome to your personal channel! You are a Doctor and your goal is to prevent Mafia members from killing civilians. Every night from this channel you can choose who do you want to visit this night. Your visit prevents person from being killed.')
                .addFields(
                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                )
                .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175723886621507656/doctor.png?ex=656c4532&is=6559d032&hm=61d2b6af9841b420c14998bb09512755d6bafa731efde73f11e453409dca69f4&=&width=1207&height=905')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                });
          channel.send({embeds: [embed]});

          doctorChannelId = channel.id;
        });

        const detectiveUserId = await gameState.getUsersByRole(gameId, 'detective');
        const detectiveChannel = await createPrivateChannelForUsers(guild, '👮⡇detective-only-' + gameId, detectiveUserId).then(channel => {
            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle('Mafia Channel')
                .setDescription('Welcome to your personal channel! You are a Detective and your goal is to find out who is the Mafia. Every night from this channel you can choose who do you investigate. This action will disclose their role to you, so if your target is Mafia - you will know this. But you still have to convince the majority to kick the Mafia out of the game.')
                .addFields(
                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                )
                .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175351078741626950/detective.png?width=1207&height=905')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                });
          channel.send({embeds: [embed]});
            detectiveChannelId = channel.id;
        });

        sendChannelIdsToDatabase(gameId, mafiaChannelId, doctorChannelId, detectiveChannelId);

        console.log('goofy mafia voice line played -1');
        await narrateAndPlayVoiceLine(client, '1174666167227531345', '1174753582193590312', '2');
        console.log('goofy mafia voice line played');

    }
});
     //  const detectiveChannel = await createPrivateChannelForUsers(guild, 'Detective Channel', [detectiveUserId]);
     //  const doctorChannel = await createPrivateChannelForUsers(guild, 'Doctor Channel', [doctorUserId]);


// Listen for day updates
gameEvents.on('dayUpdate', (data) => {
    console.log(`Day updated for game ${data.gameId} to ${data.currentDay}`);
    // Handle the day update (e.g., notify players, update the database)
});

client.login(botToken);