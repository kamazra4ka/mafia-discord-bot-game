import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';
import {
    createGame,
    gameStarts,
    nextStage
} from './Handlers/DatabaseHandlers.js';
import mysql from 'mysql2';
import {
    config
} from 'dotenv';
import {
    joinVoice,
    narrateAndPlay,
    narrateAndPlayVoiceLine
} from "./Handlers/VoiceHandlers.js";
import gameState from "../src/gameState.js";

await config();
const mysqlPassword = process.env.MYSQL_PASSWORD;

const pool = mysql.createPool({
    host: 'localhost',
    user: 'discord',
    password: `${mysqlPassword}`,
    database: 'mafia',
    waitForConnections: true,
    connectionLimit: 10000,
    queueLimit: 0,
});

export const start = async (interaction, client) => {

    // get current game
    const currentGame = await gameState.getCurrentGame();
    if (currentGame) {
        await interaction.reply('There is already a game in progress. Please wait until the end of the current match.');
        return;
    }

    const gameId = Math.floor(Math.random() * 10000);

    const button = new ButtonBuilder()
        .setCustomId('join_game')
        .setLabel('Join Game')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    const startEmbed = new EmbedBuilder()
        .setColor('3a3a3a')
        .setTitle('Mafia Game')
        .setDescription('Hey! Somebody is looking for more players to start. Click the button below to join.')
        .addFields({
            name: '❕ Limit',
            value: '0/32',
            inline: true
        }, {
            name: '👤 Players',
            value: 'None',
            inline: true
        }, {
            name: '🎙 Voice Channel',
            value: '<#1174753582193590312>',
            inline: true
        })
        .setImage('https://media.discordapp.net/attachments/978344813374083222/1174832681717071872/start.png?ex=65690732&is=65569232&hm=a03b9233f9b1e29f376630e9c3aff6aae8439b15ee50f32c7e956a510ea53cfe&=&width=1500&height=500')
        .setTimestamp()
        .setFooter({
            text: 'MafiaBot',
            iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
        });

    await interaction.reply({
        content: '',
        components: [row],
        embeds: [startEmbed]
    });

    await createGame(interaction, gameId);

    await joinVoice(interaction);




    const updateEmbed = async () => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error(err);
                return;
            }

            connection.query('SELECT userdiscordid FROM users WHERE usercurrentgame = ?', [gameId], async (err, rows) => {
                connection.release();
                if (err) {
                    console.error(err);
                    return;
                }

                let playersList = rows.map(player => `<@${player.userdiscordid.toString()}>`).join(', ') || 'None';

                // removing duplicate entries
                playersList = [...new Set(playersList.split(', '))].join(', ');
                const playersLimit = playersList.split(', ').length;

                const newEmbed = new EmbedBuilder()
                    .setColor('3a3a3a')
                    .setTitle('Mafia Game')
                    .setDescription('Hey! Somebody is looking for more players to start. Click the button below to join.')
                    .setImage('https://media.discordapp.net/attachments/978344813374083222/1174832681717071872/start.png?ex=65690732&is=65569232&hm=a03b9233f9b1e29f376630e9c3aff6aae8439b15ee50f32c7e956a510ea53cfe&=&width=1500&height=500')
                    .addFields({
                        name: '❕ Limit',
                        value: `${playersLimit}/32`,
                        inline: true
                    }, {
                        name: '👤 Players',
                        value: playersList,
                        inline: true
                    }, {
                        name: '🎙 Voice Channel',
                        value: '<#1174753582193590312>',
                        inline: true
                    })
                    .setTimestamp()
                    .setFooter({
                        text: 'MafiaBot',
                        iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                    });

                await interaction.editReply({
                    content: '',
                    components: [row],
                    embeds: [newEmbed]
                });
            });
        });
    };

    const intervalId = setInterval(updateEmbed, 1000);

    setTimeout(async () => {

        await narrateAndPlayVoiceLine(client, interaction.guildId, '1174753582193590312', '1');
        await clearInterval(intervalId);
        button.setDisabled(true);
        const newRow = new ActionRowBuilder().addComponents(button);
        await interaction.editReply({
            content: 'Registration closed.',
            components: [newRow]
        });

        await gameStarts(interaction, gameId);

        // 95 seconds timeout
        await setTimeout(() => {
            nextStage(interaction, gameId, client, (error, message) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log(message);
                }
            });
        }, 95000); // usually 95000

    }, 25000);
};