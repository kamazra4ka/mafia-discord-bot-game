import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
let embed;

import {
    addDailyVoteToDatabase,
    addTargetToDatabase,
    addUserToGame,
    assignStartRoles,
    createNightActionsRow,
    getGameDay,
    getGameId, nextStage,
    processNightActions,
    sendChannelIdsToDatabase
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
    checkIfDead,
    createPrivateChannelForUsers, disableMafiaVoteButtons, sendDetectiveVote, sendDoctorVote, sendMafiaVote
} from "../commands/handlers/privateChannel-handlers.js";
import {narrateAndPlayVoiceLine} from "../commands/handlers/voice-handlers.js";
import {morningHandler, startDailyVote} from "../commands/handlers/daynight-handlers.js";
import {checkVictory} from "../commands/handlers/victory-handlers.js";

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

    if (interaction.isButton()) {
        const currentGame = await gameState.getCurrentGame();
        if (interaction.customId === 'join_game') {
            console.log(`User ID: ${interaction.user.id} joined the game.`);
            await interaction.reply({ content: `You have joined the game!`, ephemeral: true });

            await addUserToGame(interaction)

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
                            console.log('game id is ' + gameId)
                            console.log(currentGame)
                            const gameday = await getGameDay(interaction, gameId)
                            console.log('zero try game day is ' + gameday)

                            console.log('game day is ' + gameday)
                            await addTargetToDatabase(gameday, gameId, 'gamemafiatarget', userId)
                            console.log('nuh uh')
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
                            console.log('game id is ' + gameId)
                            console.log(currentGame)
                            const gameday = await getGameDay(interaction, gameId)
                            console.log('zero try game day is ' + gameday)

                            console.log('game day is ' + gameday)
                            await addTargetToDatabase(gameday, gameId, 'gamedoctortarget', userId)
                            console.log('nuh uh doctor')
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
                        console.log(`User ID: ${interaction.user.id} voted for ${userId}.`);
                        await interaction.reply({ content: `You have voted for checking the <@${userId}>\'s role! You will receive a message in the morning with results of your check. `, ephemeral: false });

                        if (currentGame) {
                            const gameId = currentGame.id;
                            console.log('game id is ' + gameId)
                            console.log(currentGame)
                            const gameday = await getGameDay(interaction, gameId)
                            console.log('zero try game day is ' + gameday)

                            console.log('game day is ' + gameday)
                            await addTargetToDatabase(gameday, gameId, 'gamedetectivetarget', userId)
                            console.log('nuh uh detective')
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

                    const cId = '1175130149516214472';

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

                                interaction.reply({ content: `You have voted for <@${userId}>! If you want to change your mind just click on somebody's else button.`, ephemeral: true });

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
                                        iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
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
    const guild = client.guilds.cache.get('1174666167227531345');
    const guildId = 1174666167227531345, cId = '1175130149516214472';
    console.log(`Stage updated for game ${data.gameId} to ${data.currentStage}`);

    const gameId = data.gameId;
    const stage = data.currentStage;

    // check victory
    if (await checkVictory(gameId, client)) {
        // blah blah blah
    } else {
        if (stage === 1 && data.currentDay === 0) {
            const gameInfo = {
                roles: {},
                id: gameId
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
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1176101942678794271/mafia.png?ex=656da54a&is=655b304a&hm=47205392d44c7620b987c443770d63f37581215b4db5ef51b772fe243c74da77&=&width=896&height=671')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    // mentioning all mafias (multiple possible)
                    for (let i = 0; i < mafiaUserIds.length ; i++) {
                        mafiaUserIds[i] = '<@' + mafiaUserIds[i] + '>';
                        channel.send(`In this match there are ${mafiaUserIds.length} mafias.`)
                        channel.send(`The mafia is: ${mafiaUserIds[i]}`)
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
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175723886621507656/doctor.png?ex=656c4532&is=6559d032&hm=61d2b6af9841b420c14998bb09512755d6bafa731efde73f11e453409dca69f4&=&width=1207&height=905')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    // mentioning user
                    await channel.send(`Doctor: <@${doctorUserId}>`)

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
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175351078741626950/detective.png?width=1207&height=905')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    // mentioning user
                    await channel.send(`Detective: ${detectiveUserId}`)

                    await channel.send({embeds: [embed]});
                    await sendDetectiveVote(channel, gameId);
                    detectiveChannelId = channel.id;
                });

                await sendChannelIdsToDatabase(gameId, mafiaChannelId, doctorChannelId, detectiveChannelId);

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

    // day zero || stage 1

});


// Listen for day updates
gameEvents.on('dayUpdate', async (data) => {
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
        await setTimeout(async () => {
            try {
                const {
                    mafiaActionResult,
                    doctorActionResult,
                    detectiveActionResult,
                    detectiveChannelId
                } = await processNightActions(gameId);

                console.log('mafia action result is ' + mafiaActionResult.target)
                console.log('doctor action result is ' + doctorActionResult.target)

                // get username from the mafiaActionResult.target (discord id)
                let targetMafia
                if (mafiaActionResult.target) {
                    targetMafia = await client.users.fetch(mafiaActionResult.target);
                } else {
                    targetMafia.username = 'nobody'
                }


                // get username from the doctorActionResult.saved (discord id)
                let targetDoctor
                if (doctorActionResult.saved) {
                    targetDoctor = await client.users.fetch(doctorActionResult.saved);
                } else {
                    targetDoctor.username = 'nobody'
                }

                // if mafiaActionResult.success is true, then the target was killed and call the voice line 3 with additional data being player's nickname
                if (mafiaActionResult.success) {
                    await narrateAndPlayVoiceLine(client, '1174666167227531345', '1174753582193590312', '3', targetMafia.username);

                    // changing the role of the target to dead
                    await gameState.updateRole(gameId, mafiaActionResult.target, 'dead');
                    console.log('goofy mafia killed somebody voice line played');
                } else {
                    await narrateAndPlayVoiceLine(client, '1174666167227531345', '1174753582193590312', '4', targetDoctor.username);
                    console.log('goofy mafia failed to kill somebody voice line played');
                }

                playersLeft = await gameState.getPlayersList(gameId);
                playersCount = playersLeft.length;

                // Only construct the detective embed if there was a detective action
                let detectiveActionEmbed;
                if (detectiveActionResult) {
                    detectiveActionEmbed= new EmbedBuilder()
                        .setTitle('Detective Action')
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game')
                        .setDescription(`The role of the checked target (${detectiveActionResult.checked}) is ${detectiveActionResult.role}.`)
                        .setTimestamp()
                        .setFooter({ text: 'MafiaBot', iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905' });

                    // Send the detective action embed to the detective channel
                    const detectiveChannel = await client.channels.fetch(detectiveChannelId);
                    await detectiveChannel.send({ embeds: [detectiveActionEmbed] });
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

});

client.login(botToken);