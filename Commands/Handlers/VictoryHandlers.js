import gameState from "../../src/gameState.js";
import {getChannelIdsFromDatabase, getGameDay} from "./DatabaseHandlers.js";
import {sendDetectiveVote, sendDoctorVote, sendMafiaVote} from "./PrivateChannelsHandlers.js";
import {EmbedBuilder} from "discord.js";
import {generateVoiceLine} from "./OpenaiHandlers.js";
import {narrateAndPlay} from "./VoiceHandlers.js";

export const checkVictory = async (gameId, client) => {
    try {
        console.log('checking victory')

        if (gameId) {

            console.log('bruh')

            // get alive players
            const alivePlayers = await gameState.getAlivePlayersList(gameId);

            if (!alivePlayers) {

            } else {
                // get mafias
                const mafias = await gameState.getUsersByRole(gameId, 'mafia');

                // get civilians + detectives + doctors
                const civilians = await gameState.getUsersByRole(gameId, 'civilian');
                const detectives = await gameState.getUsersByRole(gameId, 'detective');
                const doctors = await gameState.getUsersByRole(gameId, 'doctor');

                if (mafias.length === 0) {
                    await victoryHandler(gameId, 'civilian', client);
                    return true;
                }

                const peacefuls = [...civilians, ...detectives, ...doctors];

                // if all mafias are dead, civilians win
                if (mafias.every(mafia => !alivePlayers.includes(mafia))) {
                    await victoryHandler(gameId, 'civilian', client);
                    return true;
                }

                // if all peacefuls are dead, mafias win
                if (peacefuls.every(peaceful => !alivePlayers.includes(peaceful))) {
                    await victoryHandler(gameId, 'mafia', client);
                    return true;
                }
            }
        }
    } catch (error) {
        const channel = await client.channels.fetch('1175130149516214472');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }
}

export const victoryHandler = async (gameId, type, client) => {
    try {
        // delete private channels
        await getChannelIdsFromDatabase(gameId).then(async channelIds => {

            console.log('channelIds:', channelIds)
            console.log('channelIds.gamemafiachid:', channelIds.gamemafiachid)
            console.log('channelIds.gamedoctorchid:', channelIds.gamedoctorchid)

            // fetch channels from channelids
            const mafiaChannel = await client.channels.fetch(channelIds.gamemafiachid);
            const doctorChannel = await client.channels.fetch(channelIds.gamedoctorchid);
            const detectiveChannel = await client.channels.fetch(channelIds.gamedetectivechid);

            // delete channels
            await mafiaChannel.delete();
            await doctorChannel.delete();
            await detectiveChannel.delete();
        });

        if (type === 'civilian') {

            // fetching the channel
            const channel = await client.channels.fetch('1175130149516214472');

            const topic = `Civilian players won the game!`
            const voiceLine = generateVoiceLine(topic).then(async voiceLine => {
                // play the voice line
                narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

                // get alive players
                const alivePlayers = await gameState.getAlivePlayersList(gameId);

                // convert them into mentions
                const alivePlayersMentions = alivePlayers.map(player => `<@${player}> `);

                // convert them into mentions + their game roles (mention: role)
                const alivePlayersRolesMentions = await Promise.all(alivePlayers.map(async player => {
                    let role = await gameState.getRole(gameId, player);

                    // add emojis to the roles + capitalise the first letter
                    switch (role) {
                        case 'mafia':
                            role = '🔪 Mafia';
                            break;
                        case 'detective':
                            role = '🕵️‍♂️ Detective';
                            break;
                        case 'doctor':
                            role = '🧑‍⚕️ Doctor';
                            break;
                        case 'civilian':
                            role = '👤 Civilian';
                            break;
                        default:
                            role = '🔴 Error';
                    }

                    return `<@${player}> - **${role}**\n`;
                }));

                const embed = new EmbedBuilder()
                    .setColor('006400')
                    .setTitle('Mafia Game: Civilian Victory!')
                    .setDescription(`🎙 Bot: ${voiceLine}\n\n**🎖️ Alive players:** \n${alivePlayersRolesMentions}\n\n`)
                    .addFields(
                        {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                        {name: '🏆 Winners', value: `${alivePlayersMentions}`, inline: true},
                    )
                    .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177965568716980234/civ_won.png?ex=65746ced&is=6561f7ed&hm=8e9fcd4bd4f246943bafba82b00814a8cd03113ebf8ef668f7ad621b58310357&=&format=webp&width=1500&height=500')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                    });

                // sending the results
                await channel.send({embeds: [embed]});

                // restart the bot
                process.exit();
            });

        } else if (type === 'mafia') {

            // fetching the channel
            const channel = await client.channels.fetch('1175130149516214472');

            const topic = `Mafia players won the game!`
            const voiceLine = generateVoiceLine(topic).then(async voiceLine => {
                // play the voice line
                narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

                // get alive players
                const alivePlayers = await gameState.getAlivePlayersList(gameId);

                // convert them into mentions
                const alivePlayersMentions = alivePlayers.map(player => `<@${player}> `);

                const alivePlayersRolesMentions = await Promise.all(alivePlayers.map(async player => {
                    let role = await gameState.getRole(gameId, player);

                    // add emojis to the roles + capitalise the first letter
                    switch (role) {
                        case 'mafia':
                            role = '🔪 Mafia';
                            break;
                        case 'detective':
                            role = '🕵️‍♂️ Detective';
                            break;
                        case 'doctor':
                            role = '🧑‍⚕️ Doctor';
                            break;
                        case 'civilian':
                            role = '👤 Civilian';
                            break;
                        default:
                            role = '🔴 Error';
                    }

                    return `<@${player}> - **${role}**\n`;
                }));


                const embed = new EmbedBuilder()
                    .setColor('8e0922')
                    .setTitle('Mafia Game: Mafia Victory!')
                    .setDescription(`🎙 Bot: ${voiceLine}\n\n**🎖️ Alive players:** \n${alivePlayersRolesMentions}\n\n`)
                    .addFields(
                        {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                        {name: '🏆 Winners', value: `${alivePlayersMentions}`, inline: true},
                    )
                    .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177965568402411661/mafia_won.png?ex=65746ced&is=6561f7ed&hm=a3d5ed1e78b1a8241478699a4eb523c2cae6d43477e7602fd8467215f98238c6&=&format=webp&width=1500&height=500')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                    });

                // sending the results
                await channel.send({embeds: [embed]});

                // restart the bot
                process.exit();

            });
        }
    } catch (error) {
        const channel = await client.channels.fetch('1175130149516214472');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }

}