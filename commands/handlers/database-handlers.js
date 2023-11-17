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

export const createGame = async (interaction, gameId) => {

    const serverDiscordId = interaction.guildId;
    console.log(`${serverDiscordId} 123 discord server id createGame`);
    const serverName = interaction.guild.name;
    const serverStartGameId = gameId;

    // get the current date in ms
    let serverstartdate = new Date();
    serverstartdate = serverstartdate.getTime();

    let isServerInDatabase = false;

    // return true if the server with such discordid is alreay in the database
    await pool.getConnection((err, connection) => {
        if (err) {
            throw err;
        }

        connection.query('SELECT * FROM servers WHERE serverdiscordid = ?', [serverDiscordId], (err, rows, fields) => {
            connection.release();
            if (err) {
                throw err;
            }
            if (rows.length === 0) {
                isServerInDatabase = false;
            } else {
                isServerInDatabase = true;
            }
        });
    });

    // if the server already in a database then just change the serverstartgameid
    if (isServerInDatabase === false) {
        pool.getConnection((err, connection) => {
            if (err) {
                throw err;
            }

            connection.query('INSERT servers SET serverdiscordid = ?, servername = ?, serverstartgameid = ?, serverstartdate = ?', [serverDiscordId, serverName, serverStartGameId, serverstartdate], (err, rows, fields) => {
                connection.release();
                console.log(123467)
                if (err) {
                    throw err;
                }
            });
        });
    } else {
        pool.getConnection((err, connection) => {
            if (err) {
                throw err;
            }

            connection.query('UPDATE servers SET serverstartgameid = ? WHERE serverdiscordid = ?', [serverStartGameId, serverDiscordId], (err, rows, fields) => {
                connection.release();
                console.log(123467)
                if (err) {
                    throw err;
                }
            });
        });
    }
}

export const addUserToGame = async (interaction) => {

        const userDiscordId = interaction.user.id;
        const userName = interaction.user.username;
        const serverDiscordId = interaction.guildId;
        console.log(`${serverDiscordId} 123 discord server id addUserToGame`);
        let gameId;

        // get the gameId from the servers table
         await pool.getConnection((err, connection) => {
            if (err) {
                throw err;
            }

            connection.query('SELECT serverstartgameid FROM servers WHERE serverdiscordid = ? ORDER BY servers.serverstartdate DESC LIMIT 1;', [serverDiscordId], (err, rows, fields) => {
                connection.release();
                if (err) {
                    throw err;
                }
                gameId = rows[0].serverstartgameid;

                pool.getConnection((err, connection) => {
                    if (err) {
                        throw err;
                    }

                    connection.query('INSERT users SET userdiscordid = ?, usernickname = ?, usercurrentgame = ?', [userDiscordId, userName, gameId], (err, rows, fields) => {
                        connection.release();
                        if (err) {
                            throw err;
                        }
                    });
                });
            });
        });
}

export const getUsersInGame = async (interaction, gameId) => {
    // get users of a game with a gameid and put them into an array and return it
    const serverDiscordId = interaction.guildId;
    console.log(`${serverDiscordId} 123 discord server id getUsersInGame`);
    let participants = [];

    await pool.getConnection((err, connection) => {
        if (err) {
            throw err;
        }

        connection.query('SELECT userdiscordid FROM users WHERE usercurrentgame = ?', [gameId], async (err, rows, fields) => {
            connection.release();
            if (err) {
                throw err;
            }
            participants = rows;
        });
    });

}

export const gameStarts = async (interaction, gameId) => {

    const serverDiscordId = interaction.guildId;
    console.log(`${serverDiscordId} 123 discord server id createGame`);
    const serverName = interaction.guild.name;
    const serverStartGameId = gameId;

    // get the current date in ms
    let gamedate = new Date();
    gamedate = gamedate.getTime();

        pool.getConnection((err, connection) => {
            if (err) {
                throw err;
            }

            connection.query('INSERT games SET gameid = ?, gameday = 0, gamestage = 0, gameserverid = ?, gameended = 0, gamedate = ?', [gameId, serverDiscordId, gamedate], (err, rows, fields) => {
                connection.release();
                console.log(12346788989999)
                if (err) {
                    throw err;
                }
            });
        });


}

export const nextStage = async (interaction, gameId) => {
    // every 24 hours in-game have 2 stages: day and night. If the game is in the day stage (0), then make it go to the night (1) (gamestage) and if it's in the night stage (1), then start a new day (gameday)
    const serverDiscordId = interaction.guildId;

    try {
        // Start a new connection using the pool
        const [currentStage] = await pool.execute('SELECT gamestage, gameday FROM games WHERE gameid = ?', [gameId]);

        if (currentStage.length === 0) {
            throw new Error('Game not found.');
        }

        let { gamestage, gameday } = currentStage[0];

        // Check the current stage and update accordingly
        if (gamestage === 0) {
            // It's currently day, switch to night
            await pool.execute('UPDATE games SET gamestage = 1 WHERE gameid = ?', [gameId]);
            console.log(`Game ${gameId} has changed to night.`);
        } else {
            // It's currently night, increment day and switch to day
            gameday++;
            await pool.execute('UPDATE games SET gamestage = 0, gameday = ? WHERE gameid = ?', [gameday, gameId]);
            console.log(`Game ${gameId} has changed to day ${gameday}.`);
        }
    } catch (error) {
        console.error('Failed to transition game stage:', error);
        throw error; // Re-throw the error for further handling if necessary
    }

}