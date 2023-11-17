import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { createGame } from './handlers/database-handlers.js';
import mysql from 'mysql2';
import { config } from 'dotenv';

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

export const start = async (interaction) => {
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
        .addFields(
            { name: 'Limit', value: '0/16', inline: true },
            { name: '👤 Players', value: 'None', inline: true },
        )
        .setImage('https://media.discordapp.net/attachments/978344813374083222/1174832681717071872/start.png?ex=65690732&is=65569232&hm=a03b9233f9b1e29f376630e9c3aff6aae8439b15ee50f32c7e956a510ea53cfe&=&width=1500&height=500')
        .setTimestamp()
        .setFooter({ text: 'MafiaBot', iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905' });

    await interaction.reply({ content: '', components: [row], embeds: [startEmbed] });

    await createGame(interaction, gameId);

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

                const playersList = rows.map(player => `<@${player.userdiscordid.toString()}>`).join(', ') || 'None';
                const playersLimit = rows.length;

                const newEmbed = new EmbedBuilder()
                    .setColor('3a3a3a')
                    .setTitle('Mafia Game')
                    .setDescription('Hey! Somebody is looking for more players to start. Click the button below to join.')
                    .setImage('https://media.discordapp.net/attachments/978344813374083222/1174832681717071872/start.png?ex=65690732&is=65569232&hm=a03b9233f9b1e29f376630e9c3aff6aae8439b15ee50f32c7e956a510ea53cfe&=&width=1500&height=500')
                    .addFields(
                        { name: 'Limit', value: `${playersLimit}/16`, inline: true },
                        { name: '👤 Players', value: playersList, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'MafiaBot', iconURL: 'https://media.discordapp.net/attachments/1148207741706440807/1174807401308901556/logo1500x1500.png?ex=6568efa7&is=65567aa7&hm=95d0bbc48ebe36cd31f0fbb418cbd406763a0295c78e62ace705c3d3838f823f&=&width=905&height=905' });

                await interaction.editReply({ content: '', components: [row], embeds: [newEmbed] });
            });
        });
    };

    const intervalId = setInterval(updateEmbed, 1000);

    setTimeout(() => {
        clearInterval(intervalId);
        button.setDisabled(true);
        const newRow = new ActionRowBuilder().addComponents(button);
        interaction.editReply({ content: 'Registration closed.', components: [newRow] });
    }, 60000);
};