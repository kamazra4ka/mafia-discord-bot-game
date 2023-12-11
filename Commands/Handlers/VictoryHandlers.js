import gameState from "../../src/gameState.js";
import {
    getChannelIdsFromDatabase
} from "./DatabaseHandlers.js";
import {
    EmbedBuilder
} from "discord.js";
import {
    generateVoiceLine
} from "./OpenaiHandlers.js";
import {
    narrateAndPlay
} from "./VoiceHandlers.js";
import {
    calculateGameReward
} from "../Shop/calculateGameReward.js";

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
        const channel = await client.channels.fetch('1180826418523942922');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }
}

export const victoryHandler = async (gameId, type, client) => {
    try {
        // delete private channels
        await getChannelIdsFromDatabase(gameId).then(async channelIds => {

            // fetch channels from channelids
            const mafiaChannel = await client.channels.fetch(channelIds.gamemafiachid);
            const doctorChannel = await client.channels.fetch(channelIds.gamedoctorchid);
            const detectiveChannel = await client.channels.fetch(channelIds.gamedetectivechid);
            const maniacChannel = await client.channels.fetch(channelIds.gamemaniacchid);

            // delete channels
            await mafiaChannel.delete();
            await doctorChannel.delete();
            await detectiveChannel.delete();
            await maniacChannel.delete();
        });

        if (type === 'civilian') {

            // fetching the channel
            const channel = await client.channels.fetch('1180826418523942922');

            const topic = `Civilian players won the game!`
            const voiceLine = generateVoiceLine(topic).then(async voiceLine => {
                // play the voice line
                narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

                // get alive players
                const alivePlayers = await gameState.getAlivePlayersList(gameId);

                // convert them into mentions + their game roles (mention: role)
                const alivePlayersRolesMentionsPromises = alivePlayers.map(async player => {
                    let role = await gameState.getRole(gameId, player);
                    const earnedCoins = await calculateGameReward(gameId, 'civilian', player);

                    // Add emojis to the roles + capitalise the first letter
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

                    // Construct the entire string to be bolded
                    const roleWithCoins = `**${role} | +${earnedCoins} 🪙**`;
                    return `<@${player}> - ${roleWithCoins}\n`;
                });

                // Resolve all promises and join the strings
                const alivePlayersRolesMentions = (await Promise.all(alivePlayersRolesMentionsPromises)).join('');

                const embed = new EmbedBuilder()
                    .setColor('006400')
                    .setTitle('Mafia Game: Civilian Victory!')
                    .setDescription(`🎙 Bot: ${voiceLine}\n\n**🎖️ Alive players:** \n${alivePlayersRolesMentions}\n\n`)
                    .addFields({
                        name: '🎙 Voice Channel',
                        value: '<#1174753582193590312>',
                        inline: true
                    }, )
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881557817409536/civ_won.png?ex=657f08a7&is=656c93a7&hm=24c0b1f6d5e78d590cbdd10a5fc3e1a3dabd6f03d9945e6f287d2358bc538a7b&=&format=webp&quality=lossless&width=1920&height=639')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                // sending the results
                await channel.send({
                    embeds: [embed]
                });

                // restart the bot
                process.exit();
            });

        } else if (type === 'mafia') {

            // fetching the channel
            const channel = await client.channels.fetch('1180826418523942922');

            const topic = `Mafia players won the game!`
            const voiceLine = generateVoiceLine(topic).then(async voiceLine => {
                // play the voice line
                narrateAndPlay('1174666167227531345', '1174753582193590312', voiceLine);

                // get alive players
                const alivePlayers = await gameState.getAlivePlayersList(gameId);

                // convert them into mentions
                const alivePlayersMentions = alivePlayers.map(player => `<@${player}>`).join(' ');

                // convert them into mentions + their game roles (mention: role)
                const alivePlayersRolesMentionsPromises = alivePlayers.map(async player => {
                    let role = await gameState.getRole(gameId, player);
                    const earnedCoins = await calculateGameReward(gameId, 'mafia', player);

                    // Add emojis to the roles + capitalise the first letter
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

                    // Construct the entire string to be bolded
                    const roleWithCoins = `**${role} | +${earnedCoins} 🪙**`;
                    return `<@${player}> - ${roleWithCoins}\n`;
                });

                // Resolve all promises and join the strings
                const alivePlayersRolesMentions = (await Promise.all(alivePlayersRolesMentionsPromises)).join('');

                const embed = new EmbedBuilder()
                    .setColor('8e0922')
                    .setTitle('Mafia Game: Mafia Victory!')
                    .setDescription(`🎙 Bot: ${voiceLine}\n\n**🎖️ Alive players:** \n${alivePlayersRolesMentions}\n\n`)
                    .addFields({
                        name: '🎙 Voice Channel',
                        value: '<#1174753582193590312>',
                        inline: true
                    }, )
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881557569933452/mafia_won.png?ex=657f08a7&is=656c93a7&hm=3dd61104999476204664e3af0494cf19a8baa9b282cdec956f02b967d8be5db9&=&format=webp&quality=lossless&width=1920&height=639')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                // sending the results
                await channel.send({
                    embeds: [embed]
                });

                // restart the bot
                process.exit();

            });
        }
    } catch (error) {
        const channel = await client.channels.fetch('1180826418523942922');
        channel.send('Something went wrong. Please, try again.\n\n' + error);
    }

}