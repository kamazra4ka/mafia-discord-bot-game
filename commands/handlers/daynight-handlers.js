import {generateVoiceLine} from "./openai-handlers.js";
import {narrateAndPlay, narrateAndPlayVoiceLine} from "./voice-handlers.js";
import {EmbedBuilder} from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import {getChannelIdsFromDatabase, nextStage, processDailyVote} from "./database-handlers.js";
import gameState from "../../src/gameState.js";
import {sendDetectiveVote, sendDoctorVote, sendMafiaVote} from "./privateChannel-handlers.js";

export const morningHandler = async (gameId, playersLeft, playersCount, currentDay, client) => {

    let topic, embed, cId = '1175130149516214472';

    try {

        // if all players have the mafia role send a message that mafia won
        if (playersLeft.every(player => player.role === 'mafia')) {
            console.log('Mafia won');
        } else {
            // put all player's mentions in a variable players
            const players = playersLeft.map(player => `<@${player}>`).join(', ');

            // call the voice line generator
            topic = `Night ${currentDay} has ended, it's morning now. ${playersCount} players are still alive.`

            await setTimeout(() => {
                const voiceLine = generateVoiceLine(topic).then(voiceLine => {
                    // play the voice line
                    narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

                    embed = new EmbedBuilder()
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game: Morning')
                        .setDescription(`🎙 Bot: ${voiceLine}`)
                        .addFields(
                            {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                            {name: '👤 Alive players', value: `${players}`, inline: true}
                        )
                        .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177345660689858670/sunrise_1.gif?ex=65722b97&is=655fb697&hm=2f82ca69a4b5a4967d410192847d915aea85b6230c7a13160581f51be2f8b3d2&=&width=837&height=295')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    client.channels.fetch(cId)
                        .then(channel => {
                            // Send a message to the channel
                            channel.send({embeds: [embed]});
                            setTimeout(async () => {
                                await startDailyVote(gameId, playersLeft, playersCount, currentDay, client);
                            }, 15000);
                        })
            }, 35000);


            });
        }
    } catch (error) {
        console.error('Error in morningHandler:', error);
    }
}

export const startDailyVote = async (gameId, playersLeft, playersCount, currentDay, client) => {

    let embed, cId = '1175130149516214472';

    try {

        const voiceLine = `It's time to vote. ${playersCount} players are still alive and now is the moment when you have to decide who is going to be executed. Click on the button below the message to vote. \n\nYou have 1 minute to vote.`
        narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

        // put all player's mentions in a variable players
        const players = playersLeft.map(player => `<@${player}>`).join(', ');

        embed = new EmbedBuilder()
            .setColor('3a3a3a')
            .setTitle('Mafia Game: Daily vote')
            .setDescription(`🎙 Bot: ${voiceLine}`)
            .addFields(
                {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                {name: '👤 Alive players', value: `${players}`, inline: true}
            )
            .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177346474233839737/daily_vote.png?ex=65722c59&is=655fb759&hm=3274e81b50f58d372674b9245388e335ea64013123a53bf28656cdc812d5a8f4&=&format=webp&width=1500&height=500')
            .setTimestamp()
            .setFooter({
                text: 'MafiaBot',
                iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
            });

        // make a row with buttons with nicknames of all alive players (one player per button)
        const row = new ActionRowBuilder();

        const playersLeftUserNames = await playersLeft.map(player => {
            return {
                id: player,
                nickname: client.users.cache.get(player).username
            }
        })

        playersLeftUserNames.forEach(player => {
            const button = new ButtonBuilder()
                .setCustomId(`daily_vote_${player.id}`) // assuming each player has a unique ID
                .setLabel(player.nickname) // using the player's nickname as the button label
                .setStyle(ButtonStyle.Primary); // setting the button style

            row.addComponents(button);
        });

        client.channels.fetch(cId)
            .then(channel => {
                // Send a message to the channel
                channel.send({embeds: [embed], components: [row]}).then(message => {
                    setTimeout(() => {
                        // disable all buttons
                        row.components.forEach(component => {
                            component.setDisabled(true);
                        });

                        // add text that the vote is ended
                        embed.setDescription(`🎙 Bot: ${voiceLine}\n\nThe vote has ended. You can't vote anymore.`)
                        message.edit({embeds: [embed], components: [row]});

                        endDailyVote(gameId, playersLeft, playersCount, currentDay, client);
                    }, 60000);
                });
            })
    } catch (error) {
        console.error('Error in startDailyVote:', error);
    }
}

export const endDailyVote = async (gameId, playersLeft, playersCount, currentDay, client) => {

    let embed, cId = '1175130149516214472';

    try {

    const executedPlayer = await processDailyVote(gameId, currentDay).then(async executedPlayer => {
        console.log('executedPlayer:', executedPlayer)
        const executedPlayerNickname = client.users.cache.get(executedPlayer.mostVotedTargetId).username;
        console.log('executedPlayerNickname:', executedPlayerNickname)
        // changing executed player's role to dead
        await gameState.updateRole(gameId, executedPlayer, 'dead');

        const playersAfterVote = playersCount - 1;

        const topic = `Civilian daily vote has ended. Civilian players think, that ${executedPlayerNickname} is a mafia and he will be executed right now, ${playersAfterVote} players are still alive. We don't know was he mafia or not.`
        const voiceLine = generateVoiceLine(topic).then(voiceLine => {
            // play the voice line
            narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

            // put all player's mentions in a variable players
            const players = playersLeft.map(player => `<@${player}>`).join(', ');

            embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle('Mafia Game: Vote results')
                .setDescription(`🎙 Bot: ${voiceLine}`)
                .addFields(
                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                    {name: '👤 Alive players', value: `${players}`, inline: true},
                    {name: '🔪 Executed player', value: `${executedPlayerNickname}`, inline: true}
                )
                .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177346474233839737/daily_vote.png?ex=65722c59&is=655fb759&hm=3274e81b50f58d372674b9245388e335ea64013123a53bf28656cdc812d5a8f4&=&format=webp&width=1500&height=500')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                });

            client.channels.fetch(cId)
                .then(channel => {
                    // Send a message to the channel
                    channel.send({embeds: [embed]})
                    // timeout for 35 seconds
                    setTimeout(async () => {
                        await nightHandler(gameId, playersLeft, playersCount, currentDay, client);
                    }, 35000);
                });
        });
    });
    } catch (error) {
        console.error('Error in endDailyVote:', error);
    }
}

// night handler
export const nightHandler = async (gameId, playersLeft, playersCount, currentDay, client) => {

    // next stage
    await nextStage(0, gameId, client, async (error, message) => {
        if (error) {
            console.error(error);
        } else {
            console.log(message);
        }});

        let embed, cId = '1175130149516214472';
        let day = currentDay + 1;

        const topic = `Night number ${day} is coming. Tell everybody to brace.`
        const voiceLine = generateVoiceLine(topic).then(voiceLine => {
            // play the voice line
            narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

            embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle('Mafia Game: Night')
                .setDescription(`🎙 Bot: ${voiceLine}`)
                .addFields(
                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                )
                .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175436517229993994/ezgif-4-5d6c3e3984.gif?ex=656b3990&is=6558c490&hm=4db7d44d24bc399c8db078ed1bc46d76c2747e8d1eb0366e61aa6cc8447be231&=&width=750&height=263')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                });

            client.channels.fetch(cId)
                .then(channel => {
                    // Send a message to the channel
                    channel.send({embeds: [embed]})
                });
        });

        await getChannelIdsFromDatabase(gameId).then(async channelIds => {

            console.log('channelIds:', channelIds)
            console.log('channelIds.gamemafiachid:', channelIds.gamemafiachid)
            console.log('channelIds.gamedoctorchid:', channelIds.gamedoctorchid)

            // fetch channels from channelids
            const mafiaChannel = await client.channels.fetch(channelIds.gamemafiachid);
            const doctorChannel = await client.channels.fetch(channelIds.gamedoctorchid);
            const detectiveChannel = await client.channels.fetch(channelIds.gamedetectivechid);

            await sendMafiaVote(mafiaChannel, gameId);
            await sendDoctorVote(doctorChannel, gameId);
            await sendDetectiveVote(detectiveChannel, gameId);
        });

        await setTimeout(async () => {
            const voiceLine = 'The mafia, doctor and detective can now choose their targets using buttons in their private channels.\n\nThe night will end in 60 seconds.';
            narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle('Mafia Game')
                .setDescription(`🎙 Bot: ${voiceLine}`)
                .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175725053258760223/channels.png?ex=656c4648&is=6559d148&hm=f3f2ac5e98d762a3b1a647412817f7d88d6f85a90d666bcec172670fe5d7bd53&=&width=1207&height=905')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                });

            client.channels.fetch(cId)
                .then(channel => {
                    // Send a message to the channel
                    channel.send({embeds: [embed]});

                    // timeout for 60 seconds
                    setTimeout(async () => {
                        // next stage
                        nextStage(0, gameId, client, (error, message) => {
                            if (error) {
                                console.error(error);
                            } else {
                                console.log(message);
                            }
                        });
                    }, 60000);
                })
        }, 25000);
    }