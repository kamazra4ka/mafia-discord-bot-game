import { getVoiceConnection, createAudioResource, AudioPlayer, VoiceConnectionStatus, joinVoiceChannel } from '@discordjs/voice';
import fs from 'fs';
import googleTTS from 'google-tts-api';
import fetch from 'node-fetch';

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
    }
};

// This function generates TTS and plays it in a voice channel
export const narrateAndPlay = async (guildId, channelId, text) => {
    // Assuming the bot is already in the voice channel and you have the guildId and channelId
    const connection = getVoiceConnection(guildId);

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
export const narrateAndPlayVoiceLine = async (guildId, channelId, voiceLine) => {
        // make a switch case for each voice line id
        switch (voiceLine) {
            case '1':
                narrateAndPlay(guildId, channelId, 'Hello, blyat, today we will play Mafia!');
                break;
            case '2':
                narrateAndPlay(guildId, channelId, 'Hello, blyat, today we will play Mafia!');
                break;
        }
}
