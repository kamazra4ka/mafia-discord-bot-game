import { getVoiceConnection, createAudioResource, AudioPlayer, VoiceConnectionStatus, joinVoiceChannel } from '@discordjs/voice';
import fs from 'fs';
import googleTTS from 'google-tts-api';
import fetch from 'node-fetch';
import {EmbedBuilder} from "discord.js";
import {generateVoiceLine} from "./openai-handlers.js";
import gameState from "../../src/gameState.js";
import {getGameDay} from "./database-handlers.js";

export const joinVoice = async (interaction) => {
    // Check if the member is in a voice channel
    if (interaction.member.voice.channel) {
        const channel = interaction.member.voice.channel;

        // Join the voice channel
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        // You can use the 'connection' to play audio, etc.
        console.log(`Joined the voice channel: ${channel.name}`);
    } else {
        console.log('Oops!')

        // join the voice channel with id
        const channel = interaction.guild.channels.cache.get('1174753582193590312');

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

    }
};

// This function generates TTS and plays it in a voice channel
export const narrateAndPlay = async (guildId, channelId, text) => {
    // Assuming the bot is already in the voice channel, and you have the guildId and channelId
    const connection = getVoiceConnection(guildId);

    console.log('goofy ' + channelId)

    if (connection && connection.joinConfig.channelId === channelId) {
        // Generate TTS

        const url = googleTTS.getAudioUrl(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });

        // Fetch the TTS audio file
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create a temporary file to store the TTS
        const tempFilePath = './temp-tts.mp3';
        fs.writeFileSync(tempFilePath, buffer);

        if (connection.state.status === VoiceConnectionStatus.Ready) {
            console.log('The connection is ready to play TTS audio!');

            // Creating audio resource from the TTS file
            const audioResource = createAudioResource(fs.createReadStream(tempFilePath));

            // Creating an audio player
            const player = new AudioPlayer();

            // Subscribing the connection to the audio player (will play audio on the voice connection)
            connection.subscribe(player);

            // Playing the audio
            player.play(audioResource);

            player.on('error', error => {
                console.error(`Error: ${error.message}`);
                player.stop();
            });

            player.on('stateChange', (oldState, newState) => {
                console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
                if (newState.status === 'idle') {
                    fs.unlinkSync(tempFilePath); // Delete the temporary file
                }
            });
        } else {
            console.error('Voice connection is not ready to play audio.');
        }
    } else {
        console.error(`The bot is not in the voice channel with ID: ${channelId}`);
    }
};
// Usage example:
// narrateAndPlay('1174666167227531345', '1174753582193590312', 'Hello, this is a test message.');


// voice lines for the game + ai
export const narrateAndPlayVoiceLine = async (client, guildId, channelId, voiceLine, additionalData) => {

    const cId = '1175130149516214472';

    let topic;
    let voiceLineText;
    let embed;

    if (!additionalData) {
        additionalData = 'nothing important';
    }

    console.log(voiceLine + ' 132vfbfgdcbdfghdf')

        // make a switch case for each voice line id
        switch (voiceLine) {
            case '1':
                topic = 'Greeting in the beginning of the game.'

                voiceLineText = await generateVoiceLine(topic)
                embed = new EmbedBuilder()
                    .setColor('3a3a3a')
                    .setTitle('Mafia Game')
                    .setDescription(`🎙 Bot: ${voiceLineText}`)
                    .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175153853440725123/introduction.png?ex=656a324f&is=6557bd4f&hm=dc9bfadab571050136b4ca51169c4ba85c161e6a10a5d5da02b805b6095bfa5c&=&width=1500&height=500')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                    });

                narrateAndPlay(guildId, channelId, voiceLineText);
                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({embeds: [embed]}).then(message => {
                            // delete after 30 seconds
                            setTimeout(() => {
                                message.delete();
                            }, 30000);
                        });
                    })

                // wait 5 seconds and then play the next voice line
                await setTimeout(async () => {
                    const voiceLineText = 'So, let\'s start the game! I will explain the rules. First, you will be assigned a role. You can be a civilian, a mafia or a special role - Doctor, etc. The mafia\'s goal is to kill all the civilians.';
                    narrateAndPlay(guildId, channelId, voiceLineText);

                    const embed = new EmbedBuilder()
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game')
                        .setDescription(`🎙 Bot: ${voiceLineText}`)
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175350035244912641/roles.png?ex=656ae905&is=65587405&hm=3d7c6c8d6ae69a62a4b1a54e1b141933e229722b241c4570d488ca6e8f28dc70&=&width=1207&height=905')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    client.channels.fetch(cId)
                        .then(channel => {
                            // Send a message to the channel
                            channel.send({embeds: [embed]}).then(message => {
                                // delete after 30 seconds
                                setTimeout(() => {
                                    message.delete();
                                }, 30000);
                            });
                        })
                }, 15000);
                await setTimeout(async () => {
                    const voiceLineText = 'The goal of the game is to find out who is the mafia and kill them. The doctor can save one person each night. The detective can find out the role of one person each night.';
                    narrateAndPlay(guildId, channelId, voiceLineText);

                    const embed = new EmbedBuilder()
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game')
                        .setDescription(`🎙 Bot: ${voiceLineText}`)
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1176101942678794271/mafia.png?ex=656da54a&is=655b304a&hm=47205392d44c7620b987c443770d63f37581215b4db5ef51b772fe243c74da77&=&width=896&height=671')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    client.channels.fetch(cId)
                        .then(channel => {
                            // Send a message to the channel
                            channel.send({embeds: [embed]}).then(message => {
                                // delete after 30 seconds
                                setTimeout(() => {
                                    message.delete();
                                }, 30000);
                            });
                        })
                }, 38000);
                await setTimeout(async () => {
                    const voiceLineText = 'The civilians can vote to kill one person each day. The mafia can kill one person each night. The game ends when all the mafia are dead, or when all the civilians are dead.';
                    narrateAndPlay(guildId, channelId, voiceLineText);

                    const embed = new EmbedBuilder()
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game')
                        .setDescription(`🎙 Bot: ${voiceLineText}`)
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175351853261803550/civilian.png?ex=656aeab6&is=655875b6&hm=035983a1fd77fc2a366f581dc3184aa7c7f43e9fbdc2090399b3d1299d6e948e&=&width=1207&height=905')
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    client.channels.fetch(cId)
                        .then(channel => {
                            // Send a message to the channel
                            channel.send({embeds: [embed]}).then(message => {
                                // delete after 30 seconds
                                setTimeout(() => {
                                    message.delete();
                                }, 30000);
                            });
                        })
                }, 67000);
                await setTimeout(async () => {
                    const voiceLineText = ' A better instruction can be found in the chat. Good luck!';
                    narrateAndPlay(guildId, channelId, voiceLineText);

                    const embed = new EmbedBuilder()
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game')
                        .setDescription(`🎙 Bot: ${voiceLineText}`)
                        .setTimestamp()
                        .setFooter({
                            text: 'MafiaBot',
                            iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                        });

                    client.channels.fetch(cId)
                        .then(channel => {
                            // Send a message to the channel
                            channel.send({embeds: [embed]}).then(message => {
                                // delete after 30 seconds
                                setTimeout(() => {
                                    message.delete();
                                }, 30000);
                            });
                        })
                }, 85000);

                break;
            case '2':

                        await setTimeout(async () => {
                            topic = 'First night is coming. Tell everyone to brace.'

                            voiceLineText = await generateVoiceLine(topic)
                            embed = new EmbedBuilder()
                                .setColor('3a3a3a')
                                .setTitle('Mafia Game: Night')
                                .setDescription(`🎙 Bot: ${voiceLineText}`)
                                .addFields(
                                    {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true}
                                )
                                .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175436517229993994/ezgif-4-5d6c3e3984.gif?ex=656b3990&is=6558c490&hm=4db7d44d24bc399c8db078ed1bc46d76c2747e8d1eb0366e61aa6cc8447be231&=&width=750&height=263')
                                .setTimestamp()
                                .setFooter({
                                    text: 'MafiaBot',
                                    iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                                });

                            narrateAndPlay(guildId, channelId, voiceLineText);
                            client.channels.fetch(cId)
                                .then(channel => {
                                    // Send a message to the channel
                                    channel.send({embeds: [embed]});
                                })
                        }, 5000);

                await setTimeout(async () => {
                    const voiceLineText = 'The mafia, doctor and detective can now choose their targets using buttons in their private channels.\n\nThe night will end in 60 seconds.';
                    narrateAndPlay(guildId, channelId, voiceLineText);

                    const embed = new EmbedBuilder()
                        .setColor('3a3a3a')
                        .setTitle('Mafia Game')
                        .setDescription(`🎙 Bot: ${voiceLineText}`)
                        .setImage('https://media.discordapp.net/attachments/1175130149516214472/1175725053258760223/channels.png?ex=656c4648&is=6559d148&hm=f3f2ac5e98d762a3b1a647412817f7d88d6f85a90d666bcec172670fe5d7bd53&=&width=1207&height=905')
                        .setTimestamp()
                        .setFooter({ text: 'MafiaBot', iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905' });

                    client.channels.fetch(cId)
                        .then(channel => {
                            // Send a message to the channel
                            channel.send({ embeds: [embed] });
                        })
                }, 25000);
                break;
            case '3':
                topic = `Player ${additionalData} has been killed by Mafia. Doctor didn't save him.`

                voiceLineText = await generateVoiceLine(topic)
                embed = new EmbedBuilder()
                    .setColor('8e0922')
                    .setTitle('Mafia Game: A player has been found dead.')
                    .setDescription(`🎙 Bot: ${voiceLineText}`)
                    .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177013332201443428/mafia_success.png?ex=6570f616&is=655e8116&hm=b7c2a029a7f1e8358aadc552b76e8a301d7fdc63a12cc17eee5a3fe2fdbc8a84&=&format=webp&width=1500&height=500')
                    .setTimestamp()
                    .addFields(
                        {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                        {name: '👤 Dead player', value: `${additionalData}`, inline: true}
                    )
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                    });

                narrateAndPlay(guildId, channelId, voiceLineText);
                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({embeds: [embed]})
                    })
                break;
            case '4':
                topic = `Mafia tried to kill the player ${additionalData}. Doctor saved him.`

                voiceLineText = await generateVoiceLine(topic)
                embed = new EmbedBuilder()
                    .setColor('006400')
                    .setTitle('Mafia Game: An attempt of a murder was found.')
                    .setDescription(`🎙 Bot: ${voiceLineText}`)
                    .setImage('https://media.discordapp.net/attachments/1174711985686970368/1177013332482465903/doctor_success.png?ex=6570f616&is=655e8116&hm=68bea818f11053eaf07219fd4f9dc8a25e6e75b94ff20620e4b68dfe92edc4e3&=&format=webp&width=1500&height=500')
                    .setTimestamp()
                    .addFields(
                        {name: '🎙 Voice Channel', value: '<#1174753582193590312>', inline: true},
                        {name: '👤 Saved player', value: `${additionalData}`, inline: true}
                    )
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905'
                    });

                narrateAndPlay(guildId, channelId, voiceLineText);
                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({embeds: [embed]})
                    })
                break;
        }
}
