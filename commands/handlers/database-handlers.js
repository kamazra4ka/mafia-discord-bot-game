import mysql from 'mysql2';
import { config } from 'dotenv';
import gameEvents from "../emitters/emitter.js";
import gameState from "../../src/gameState.js";

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

// assignStartRoles
export const assignStartRoles = async (gameId) => {
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

            // Get the player IDs as an array
            console.log(rows)
            const playerIds = rows
                .map(player => player.userdiscordid && player.userdiscordid.toString())
                .filter(Boolean); // Filter out falsy values


            // Add each player to the game
            playerIds.forEach(playerId => {
                console.log('Adding player ID:', playerId);
                if (!playerId) {
                    console.error('Invalid player ID:', playerId);
                    return;
                }
                if (gameState.getGame(gameId).roles[playerId]) {
                    console.error('Player already added:', playerId);
                    return;
                }
                gameState.addPlayer(gameId, playerId);
            });


// Now call assignRoles to populate the roles
            gameState.assignRoles(gameId);

            const updatedGameInfo = gameState.getGame(gameId);
            console.log(updatedGameInfo.roles);
        });

    });
}


export const nextStage = (interaction, gameId, callback) => {
    const serverDiscordId = interaction.guildId;

    // Get the current stage of the game
    pool.query('SELECT gamestage, gameday FROM games WHERE gameid = ?', [gameId], (error, results) => {
        if (error) {
            return callback(error, null);
        }

        // If no game is found
        if (results.length === 0) {
            return callback(new Error('Game not found.'), null);
        }

        const currentStage = results[0];
        let query = '';
        let queryParams = [];

        if (currentStage.gamestage === 0) {
            // It's currently day, switch to night
            query = 'UPDATE games SET gamestage = 1 WHERE gameid = ?';
            queryParams = [gameId];
            gameEvents.emit('stageUpdate', { gameId, currentStage: 1, currentDay: currentStage.gameday });
        } else {
            // It's currently night, increment day and switch to day
            query = 'UPDATE games SET gamestage = 0, gameday = gameday + 1 WHERE gameid = ?';
            queryParams = [gameId];
            gameEvents.emit('stageUpdate', { gameId, currentStage: 0, currentDay: currentStage.gameday + 1 });
            gameEvents.emit('dayUpdate', { gameId, currentDay: currentStage.gameday + 1 });
        }

        // Update the game stage
        pool.query(query, queryParams, (error, results) => {
            if (error) {
                return callback(error, null);
            }
            callback(null, 'Stage updated successfully');
        });
    });
};

// send doctorChannelId and other channel ids to the database to tables games
export const sendChannelIdsToDatabase = async (interaction, gameId, doctorChannelId, detectiveChannelId, mafiaChannelId) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query('UPDATE games SET doctorchannelid = ?, detectivechannelid = ?, mafiachannelid = ? WHERE gameid = ?', [doctorChannelId, detectiveChannelId, mafiaChannelId, gameId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);
                return;
            }
        });
    });
}

// get the channel ids from the database
export const getChannelIdsFromDatabase = async (interaction, gameId) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query('SELECT doctorchannelid, detectivechannelid, mafiachannelid FROM games WHERE gameid = ?', [gameId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);
                return;
            }
            console.log(rows);
            return rows;
        });
    });
}

// Usage:
// nextStage(interaction, gameId, (error, message) => {
//     if (error) {
//         console.error(error);
//     } else {
//         console.log(message);
//     }
// });
