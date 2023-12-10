import {
    AudioPlayer,
    createAudioResource,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnectionStatus
} from '@discordjs/voice';
import fs from 'fs';
import googleTTS from 'google-tts-api';
import fetch from 'node-fetch';
import {
    EmbedBuilder
} from "discord.js";
import {
    generateVoiceLine
} from "./OpenaiHandlers.js";

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
    try {
        // Assuming the bot is already in the voice channel, and you have the guildId and channelId
        const connection = getVoiceConnection(guildId);

        console.log('goofy ' + channelId)

        if (connection && connection.joinConfig.channelId === channelId) {
            // Generate TTS

            // in case the text is too long (doesn't happen usually)
            if (text.length > 200) {
                text = text.substring(0, 200);
            }

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
    } catch (error) {
        console.log(error)
    }
};
// Usage example:
// narrateAndPlay('1174666167227531345', '1174753582193590312', 'Hello, this is a test message.');


// voice lines for the game + ai
export const narrateAndPlayVoiceLine = async (client, guildId, channelId, voiceLine, additionalData) => {

    const cId = '1180826418523942922';

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
                .setImage('https://media.discordapp.net/attachments/1180826418523942922/1175153853440725123/introduction.png?ex=656a324f&is=6557bd4f&hm=dc9bfadab571050136b4ca51169c4ba85c161e6a10a5d5da02b805b6095bfa5c&=&width=1500&height=500')
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            narrateAndPlay(guildId, channelId, voiceLineText);
            client.channels.fetch(cId)
                .then(channel => {
                    // Send a message to the channel
                    channel.send({
                        embeds: [embed]
                    }).then(message => {
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
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881502582607942/mafia.png?ex=657f0899&is=656c9399&hm=a1bc47a1cfe1279e4d710e256fc3e38d5654646ce674c589fabcbcb3fed51e51&=&format=webp&quality=lossless&width=1293&height=969')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        }).then(message => {
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
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881504189022248/civilian.png?ex=657f089a&is=656c939a&hm=bda5255b77bd02ef17df4b941ccd9cb66467667c7755f2e6ee665e1e1d2dd727&=&format=webp&quality=lossless&width=1293&height=969')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        }).then(message => {
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
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881504939814952/roles.png?ex=657f089a&is=656c939a&hm=6f68bfa6babc14dcf43ce8ca60429230b8f3dd34904c3fa06545b61dc75cd8a5&=&format=webp&quality=lossless&width=1293&height=969')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        }).then(message => {
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
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        }).then(message => {
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
                    .addFields({
                        name: '🎙 Voice Channel',
                        value: '<#1174753582193590312>',
                        inline: true
                    })
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881503706685550/ezgif-4-5d6c3e3984.gif?ex=657f089a&is=656c939a&hm=cb386cde06ab7810cfd5660f29bdc698254479101009bb4938dc08e38ff4fda1&=&width=1125&height=395')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                narrateAndPlay(guildId, channelId, voiceLineText);
                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        });
                    })
            }, 5000);

            await setTimeout(async () => {
                const voiceLineText = 'The mafia, doctor and detective can now choose their targets using buttons in their private channels. If you don\'t see any channels that means you are a civilian. \n\nThe night will end in 60 seconds.';
                narrateAndPlay(guildId, channelId, voiceLineText);

                const embed = new EmbedBuilder()
                    .setColor('3a3a3a')
                    .setTitle('Mafia Game')
                    .setDescription(`🎙 Bot: ${voiceLineText}`)
                    .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881502989451365/channels.png?ex=657f089a&is=656c939a&hm=8dfdf541d40e870b706415d6f8419d74aa68ea113c7b0a64f5180d7671cb6b35&=&format=webp&quality=lossless&width=1293&height=969')
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        });
                    })
            }, 25000);
            break;
        case '3':
            topic = `Player ${additionalData} has been killed by Mafia. Doctor didn't come to him.`

            voiceLineText = await generateVoiceLine(topic)
            embed = new EmbedBuilder()
                .setColor('8e0922')
                .setTitle('Mafia Game: A player has been found dead.')
                .setDescription(`🎙 Bot: ${voiceLineText}`)
                .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881557062434826/mafia_success.png?ex=657f08a6&is=656c93a6&hm=bf74e271f0f483e29db540d223043cda8b77c5d2c5090b327ec400878d46054d&=&format=webp&quality=lossless&width=1920&height=639')
                .setTimestamp()
                .addFields({
                    name: '🎙 Voice Channel',
                    value: '<#1174753582193590312>',
                    inline: true
                }, {
                    name: '👤 Dead player',
                    value: `${additionalData}`,
                    inline: true
                })
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            narrateAndPlay(guildId, channelId, voiceLineText);
            client.channels.fetch(cId)
                .then(channel => {
                    // Send a message to the channel
                    channel.send({
                        embeds: [embed]
                    })
                })
            break;
        case '4':
            topic = `Mafia or the Maniac tried to kill the player ${additionalData}. Doctor saved him.`

            voiceLineText = await generateVoiceLine(topic)
            embed = new EmbedBuilder()
                .setColor('006400')
                .setTitle('Mafia Game: An attempt of a murder was found.')
                .setDescription(`🎙 Bot: ${voiceLineText}`)
                .setImage('https://media.discordapp.net/attachments/669834222051262465/1180881557288910968/doctor_success.png?ex=657f08a6&is=656c93a6&hm=09c3f811960e6cee06fddf04b7a36781e81e4be29e771b8260fd9f632f98693a&=&format=webp&quality=lossless&width=1920&height=639')
                .setTimestamp()
                .addFields({
                    name: '🎙 Voice Channel',
                    value: '<#1174753582193590312>',
                    inline: true
                }, {
                    name: '👤 Saved player',
                    value: `${additionalData}`,
                    inline: true
                })
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            narrateAndPlay(guildId, channelId, voiceLineText);
            client.channels.fetch(cId)
                .then(channel => {
                    // Send a message to the channel
                    channel.send({
                        embeds: [embed]
                    })
                })
            break;
        case '5':
            topic = `Player ${additionalData} has been killed by the Maniac (not the Mafia, Maniac is playing against everybody). Doctor didn't come to him.`

            voiceLineText = await generateVoiceLine(topic)
            embed = new EmbedBuilder()
                .setColor('480512')
                .setTitle('Mafia Game: A player has been found dead.')
                .setDescription(`🎙 Bot: ${voiceLineText}`)
                .setImage('https://media.discordapp.net/attachments/669834222051262465/1183429916344189058/maniacsuccess.png?ex=65884dff&is=6575d8ff&hm=0340113661749ead522abf1e24ef4567c19a73c89c61138561bc81825467c14e&=&format=webp&quality=lossless&width=1500&height=500')
                .setTimestamp()
                .addFields({
                    name: '🎙 Voice Channel',
                    value: '<#1174753582193590312>',
                    inline: true
                }, {
                    name: '👤 Dead player',
                    value: `${additionalData}`,
                    inline: true
                })
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            setTimeout(() => {
                narrateAndPlay(guildId, channelId, voiceLineText);
                client.channels.fetch(cId)
                    .then(channel => {
                        // Send a message to the channel
                        channel.send({
                            embeds: [embed]
                        })
                    })
            }, 10000);
            break;
    }
}