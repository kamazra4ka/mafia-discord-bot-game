import {config} from 'dotenv';
import {Client, EmbedBuilder, GatewayIntentBits} from 'discord.js';
import {
    addDailyVoteToDatabase,
    addTargetToDatabase,
    addUserToGame,
    assignStartRoles,
    createNightActionsRow,
    getGameDay,
    nextStage,
    processNightActions,
    sendChannelIdsToDatabase
} from "../Commands/Handlers/DatabaseHandlers.js";

import {ping} from '../Commands/ping.js';

import {start} from '../Commands/start.js';
import gameEvents from "../Commands/Emitters/emitter.js";
import gameState from "./gameState.js";

import {
    checkIfDead,
    createPrivateChannelForUsers,
    sendDetectiveVote,
    sendDoctorVote,
    sendMafiaVote
} from "../Commands/Handlers/PrivateChannelsHandlers.js";
import {narrateAndPlayVoiceLine} from "../Commands/Handlers/VoiceHandlers.js";
import {morningHandler} from "../Commands/Handlers/DayNightHandlers.js";
import {checkVictory} from "../Commands/Handlers/VictoryHandlers.js";
import {stopAllGames} from "../Commands/stop.js";
import {shop} from "../Commands/shop.js";
import {buyItem} from "../Commands/Shop/buyItem.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
let embed;

// get the token from the .env file using dotenv
config();
const botToken = process.env.DISCORD_TOKEN;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.commandName === 'ping') {
        await ping(interaction);
    }

    if (interaction.commandName === 'start') {
        await start(interaction, client);
    }

    if (interaction.commandName === 'stop') {

        if (interaction.user.id === '669462196589166623') {
            await stopAllGames(interaction)
        } else {
            await interaction.reply({ content: `You don't have permission to do that.`, ephemeral: true });
        }


    }

    if (interaction.commandName === 'shop') {
        await shop(interaction, client);
    }

    if (interaction.isButton()) {
        const currentGame = await gameState.getCurrentGame();
        if (interaction.customId === 'join_game') {
            console.log(`User ID: ${interaction.user.id} joined the game.`);
            await interaction.reply({ content: `You have joined the game!`, ephemeral: true });

            await addUserToGame(interaction)
        }

        if (interaction.customId.startsWith('buy_item_')) {
            const item = interaction.customId.split('_')[2];

            console.log(`User ID: ${interaction.user.id} bought the item ${item}.`);

            await buyItem(interaction, item)
        }

        if (currentGame) {
            if (await checkIfDead(interaction.user.id, currentGame.id)) {
                await interaction.reply({ content: `You are dead. You can't vote.`, ephemeral: true });
            } else {
                // if starts from mafia_vote_(userid) get the userid from the name
                if (interaction.customId.startsWith('mafia_vote_')) {
                    try {
                        const userId = interaction.customId.split('_')[2];
                        console.log(`User ID: ${interaction.user.id} voted for ${userId}.`);
                        await interaction.reply({ content: `Mafia ${interaction.user.username} has voted for <@${userId}>!`, ephemeral: false });

                        if (currentGame) {
                            const gameId = currentGame.id;
                            const gameday = await getGameDay(interaction, gameId)

                            await addTargetToDatabase(gameday, gameId, 'gamemafiatarget', userId)
                        } else {
                            // send message to the interaction channel
                            await interaction.channel.send('Something went wrong. Please, try again.');
                        }
                    } catch (error) {
                        interaction.channel.send('Something went wrong. Please, try again.\n\n' + error);
                    }
                }

                // if starts from doctor_vote_(userid) get the userid from the name
                if (interaction.customId.startsWith('doctor_vote_')) {
                    try {
                        const userId = interaction.customId.split('_')[2];
                        console.log(`User ID: ${interaction.user.id} voted for ${userId}.`);
                        await interaction.reply({ content: `You have voted for <@${userId}>!`, ephemeral: false });

                        if (currentGame) {
                            const gameId = currentGame.id;
                            const gameday = await getGameDay(interaction, gameId)

                            await addTargetToDatabase(gameday, gameId, 'gamedoctortarget', userId)
                        } else {
                            // send message to the interaction channel
                            await interaction.channel.send('Something went wrong. Please, try again.');
                        }
                    } catch (error) {
                        interaction.channel.send('Something went wrong. Please, try again.\n\n' + error);
                    }
                }

                // if starts from detective_vote_(userid) get the userid from the name
                if (interaction.customId.startsWith('detective_vote_')) {
                    try {
                        const userId = interaction.customId.split('_')[2];
                        await interaction.reply({ content: `You have voted for checking the <@${userId}>\'s role! You will receive a message in the morning with results of your check. `, ephemeral: false });

                        if (currentGame) {
                            const gameId = currentGame.id;
                            const gameday = await getGameDay(interaction, gameId)

                            await addTargetToDatabase(gameday, gameId, 'gamedetectivetarget', userId)
                        } else {
                            // send message to the interaction channel
                            await interaction.channel.send('Something went wrong. Please, try again.');
                        }
                    } catch (error) {
                        interaction.channel.send('Something went wrong. Please, try again.\n\n' + error);
                    }
                }

                // daily vote buttons
                if (interaction.customId.startsWith('daily_vote_')) {
                    // get the userid of target and userid of voter (daily_vote_userid_voterid)
                    const userId = interaction.customId.split('_')[2];
                    const voterId = interaction.user.id;

                    const cId = '1180826418523942922';

                    try {
                        if (currentGame) {

                            // if the user's game role is dead, then don't allow to vote
                            const userRole = await gameState.getRole(currentGame.id, voterId);
                            if (userRole === 'dead') {
                                await interaction.reply({ content: `You are dead. You can't vote.`, ephemeral: true });
                            } else {
                                const gameId = currentGame.id;
                                const gameDay = await getGameDay(interaction, gameId)
                                addDailyVoteToDatabase(gameDay, gameId, voterId, userId)

                                interaction.reply({ content: `You have voted for <@${userId}>! If you want to change your mind just click on somebody's else button.`, ephemeral: true }).then(message => {
                                    // delete message after 2 sec
                                    setTimeout(() => {
                                        message.delete();
                                    }, 2000);
                                });

                                let userUsername = client.users.cache.get(userId).username;
                                let targetUsername = client.users.cache.get(voterId).username;

                                // capitalizing the first letter
                                userUsername = userUsername.charAt(0).toUpperCase() + userUsername.slice(1);
                                targetUsername = targetUsername.charAt(0).toUpperCase() + targetUsername.slice(1);

                                embed = new EmbedBuilder()
                                    .setColor('3a3a3a')
                                    .setTitle('Mafia Game: Daily vote')
                                    .setDescription(`**${targetUsername}** has voted to execute **${userUsername}**`)
                                    .setTimestamp()
                                    .setFooter({
                                        text: 'MafiaBot',
                                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                                    });

                                client.channels.fetch(cId)
                                    .then(channel => {
                                        // Send a message to the channel
                                        channel.send({embeds: [embed]}).then(message => {
                                            // delete message after 60 sec
                                            setTimeout(() => {
                                                message.delete();
                                            }, 60000);
                                        });
                                        setTimeout(async () => {
                                            await addDailyVoteToDatabase(gameDay, gameId, voterId, userId);
                                        }, 15000);
                                    })
                            }

                        }
                    } catch (error) {
                        interaction.channel.send('Something went wrong. Please, try again.\n\n' + error);
                    }
                }
        }

        }
    }
 } catch (error) {
     interaction.channel.send('Something went wrong. Please, try again.\n\n' + error);
 }
});

// Listen for stage updates
gameEvents.on('stageUpdate', async (data) => {
    try {
        const guild = client.guilds.cache.get('1174666167227531345');
        const guildId = 1174666167227531345, cId = '1180826418523942922';

        const gameId = data.gameId;
        const stage = data.currentStage;

        // check victory
        if (await checkVictory(gameId, client)) {
            // blah blah blah
        } else {
            if (stage === 1 && data.currentDay === 0) {
                const gameInfo = {
                    roles: {},
                    id: gameId,
                    dailyVotes: {},
                    nightVotes: {},
                    channelIds: {}
                };

                // Initialize the game with no roles assigned yet
                await gameState.setGame(gameId, gameInfo);
                await assignStartRoles(gameId);

                // if there are 3 or less players, then don't start the game
                const playersCount = await gameState.getAlivePlayersList(gameId);
                if (false) {
                    const channel = await client.channels.fetch(cId);
                    await channel.send({ content: `There are not enough players to start the game.`, ephemeral: true });
                } else {

                    let mafiaChannelId;
                    let doctorChannelId;
                    let detectiveChannelId;

                    // create a row for actions
                    await createNightActionsRow(data.gameId, data.currentDay);

                    setTimeout(async () => {
                        const mafiaUserIds = await gameState.getUsersByRole(gameId, 'mafia');
                        console.log(`Mafia user ids is ${mafiaUserIds}`)
                        console.log(`Mafia user ids is ${mafiaUserIds}`)
                        console.log(`Mafia user ids is ${mafiaUserIds}`)
                        const mafiaChannel = await createPrivateChannelForUsers(guild, '🔪⡇mafia-only-' + gameId, mafiaUserIds).then(async channel => {
                            const embed = new EmbedBuilder()
                                .setColor('3a3a3a')
                                .setTitle('Mafia Channel')
                                .setDescription('Welcome to the Mafia Channel! You can talk with your fellow mafia members here.\n\n In matches with multiple mafias every mafia can choose a target, but only one target will be killed. Please, discuss your target with other mafia members. Have fun!')
                                .addFields(
                                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                                )
                                .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881502582607942/mafia.png?ex=657f0899&is=656c9399&hm=a1bc47a1cfe1279e4d710e256fc3e38d5654646ce674c589fabcbcb3fed51e51&=&format=webp&quality=lossless&width=1406&height=1053')
                                .setTimestamp()
                                .setFooter({
                                    text: 'MafiaBot',
                                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                                });

                            // mentioning all mafias (multiple possible)
                            for (let i = 0; i < mafiaUserIds.length ; i++) {
                                mafiaUserIds[i] = '<@' + mafiaUserIds[i] + '>';
                                channel.send(`# In this match there are ${mafiaUserIds.length} mafias.`)
                                channel.send(`# Mafia members: ${mafiaUserIds[i]}`)
                            }

                            await channel.send({embeds: [embed]});
                            await sendMafiaVote(channel, gameId);

                            // save the id for later votes in the gamestate
                            mafiaChannelId = channel.id;
                        })

                        const doctorUserId = await gameState.getUsersByRole(gameId, 'doctor');
                        const doctorChannel = await createPrivateChannelForUsers(guild, '💊⡇doctor-only-' + gameId, doctorUserId).then(async channel => {
                            const embed = new EmbedBuilder()
                                .setColor('3a3a3a')
                                .setTitle('Doctor Channel')
                                .setDescription('Welcome to your personal channel! You are a Doctor and your goal is to prevent Mafia members from killing civilians. Every night from this channel you can choose who do you want to visit this night. Your visit prevents person from being killed.')
                                .addFields(
                                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                                )
                                .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881503404691498/doctor.png?ex=657f089a&is=656c939a&hm=fd6c12e54b0b6037999dbbce5529528186c4cbd1fbf6252de620af72058605f8&=&format=webp&quality=lossless&width=1293&height=969')
                                .setTimestamp()
                                .setFooter({
                                    text: 'MafiaBot',
                                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                                });

                            // mentioning user
                            await channel.send(`# Doctor: <@${doctorUserId}>`)

                            await channel.send({embeds: [embed]});
                            await sendDoctorVote(channel, gameId);

                            doctorChannelId = channel.id;
                        });

                        const detectiveUserId = await gameState.getUsersByRole(gameId, 'detective');
                        const detectiveChannel = await createPrivateChannelForUsers(guild, '👮⡇detective-only-' + gameId, detectiveUserId).then(async channel => {
                            const embed = new EmbedBuilder()
                                .setColor('3a3a3a')
                                .setTitle('Detective Channel')
                                .setDescription('Welcome to your personal channel! You are a Detective and your goal is to find out who is the Mafia. Every night from this channel you can choose who do you investigate. This action will disclose their role to you, so if your target is Mafia - you will know this. But you still have to convince the majority to kick the Mafia out of the game.')
                                .addFields(
                                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                                )
                                .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881504541347950/detective.png?ex=657f089a&is=656c939a&hm=21e69af569052248bdaf0add3c232cdd823570910d13dc0208bef689a179cd85&=&format=webp&quality=lossless&width=1293&height=969')
                                .setTimestamp()
                                .setFooter({
                                    text: 'MafiaBot',
                                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                                });

                            // mentioning user
                            await channel.send(`Detective: ${detectiveUserId}`)

                            await channel.send({embeds: [embed]});
                            await sendDetectiveVote(channel, gameId);
                            detectiveChannelId = channel.id;
                        });

                        await sendChannelIdsToDatabase(gameId, mafiaChannelId, doctorChannelId, detectiveChannelId);

                        await gameState.setMafiaChannel(gameId, mafiaChannelId);
                        await gameState.setDoctorChannel(gameId, doctorChannelId);
                        await gameState.setDetectiveChannel(gameId, detectiveChannelId);

                        console.log('goofy mafia voice line played -1');
                        await narrateAndPlayVoiceLine(client, '1174666167227531345', '1174753582193590312', '2');
                        console.log('goofy mafia voice line played');

                        // 60 seconds interval
                        await setTimeout(async () => {
                            try {
                                await setTimeout(() => {
                                    nextStage(0, gameId, client, (error, message) => {
                                        if (error) {
                                            console.error(error);
                                        } else {
                                            console.log(message);
                                        }
                                    });
                                }, 2500);
                                console.log('NEW DAY TEST TEST TEST')
                                console.log('NEW DAY TEST TEST TEST')
                                console.log('NEW DAY TEST TEST TEST')

                                // stop the interval
                                clearInterval(this);

                            } catch (error) {
                                console.error('Error processing night actions:', error);
                            }
                        }, 60000);

                    }, 5000);

                }
            }
        }
    } catch (error) {
        const channel = await client.channels.fetch('1180826418523942922');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }

    // day zero || stage 1

});


// Listen for day updates
gameEvents.on('dayUpdate', async (data) => {
    try {
        console.log(`Day updated for game ${data.gameId} to ${data.currentDay}`);

        const gameId = data.gameId;
        const currentDay = data.currentDay;

        // get amount of players left (role not dead)
        let playersLeft;
        let playersCount;

        // conducting a victory check
        if (await checkVictory(gameId, client)) {
            // blah blah blah
        } else {

            // 60 seconds interval
            setTimeout(async () => {
                try {
                    const {
                        mafiaActionResult,
                        doctorActionResult,
                        detectiveActionResult,
                        detectiveChannelId
                    } = await processNightActions(gameId, data.currentDay);

                    // get username from the mafiaActionResult.target (discord id)
                    let targetMafia
                    if (mafiaActionResult.target) {
                        targetMafia = await client.users.fetch(mafiaActionResult.target);
                    } else {
                        targetMafia = await client.users.fetch('1175134258482917518')
                    }


                    // get username from the doctorActionResult.saved (discord id)
                    let targetDoctor
                    if (doctorActionResult.saved) {
                        targetDoctor = await client.users.fetch(doctorActionResult.saved);
                    } else {
                        targetDoctor = await client.users.fetch('1175134258482917518')
                    }

                    // if mafiaActionResult.success is true, then the target was killed and call the voice line 3 with additional data being player's nickname
                    if (mafiaActionResult.success) {
                        await narrateAndPlayVoiceLine(client, '1174666167227531345', '1174753582193590312', '3', targetMafia.username);

                        // changing the role of the target to dead
                        await gameState.updateRole(gameId, mafiaActionResult.target, 'dead');
                    } else {
                        await narrateAndPlayVoiceLine(client, '1174666167227531345', '1174753582193590312', '4', targetDoctor.username);
                    }

                    playersLeft = await gameState.getPlayersList(gameId);
                    playersCount = playersLeft.length;

                    // Only construct the detective embed if there was a detective action
                    let detectiveActionEmbed;
                    if (detectiveActionResult) {
                        detectiveActionEmbed = new EmbedBuilder()
                            .setTitle('Detective Action')
                            .setColor('3a3a3a')
                            .setTitle('Mafia Game')
                            .setDescription(`The role of the checked target (${detectiveActionResult.checked}) is ${detectiveActionResult.role}.`)
                            .setTimestamp()
                            .setFooter({
                                text: 'MafiaBot',
                                iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                            });

                        // Send the detective action embed to the detective channel
                        const detectiveChannel = await client.channels.fetch(detectiveChannelId);
                        await detectiveChannel.send({embeds: [detectiveActionEmbed]});
                    }
                } catch (error) {
                    console.error('Error processing night actions:', error);
                }
            }, 15000);

            // call morning handler
            setTimeout(async () => {
                await morningHandler(gameId, playersLeft, playersCount, currentDay, data.client);
            }, 45000);
        }
    } catch (error) {
        const channel = await client.channels.fetch('1180826418523942922');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }

});

client.login(botToken);