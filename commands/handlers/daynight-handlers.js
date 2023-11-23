import {generateVoiceLine} from "./openai-handlers.js";
import {narrateAndPlay, narrateAndPlayVoiceLine} from "./voice-handlers.js";
import {EmbedBuilder} from "discord.js";

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
                    })
            });
        }
    } catch (error) {
        console.error('Error in morningHandler:', error);
    }
}