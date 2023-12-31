import mysql from 'mysql2';
import {config} from 'dotenv';
import gameEvents from "../Emitters/emitter.js";
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

function mostElementInArray(arr) {
    // Создаем объект для подсчета количества вхождений каждого элемента
    // Creating element count object
    let countMap = {};
    for (let i = 0; i < arr.length; i++) {
        countMap[arr[i]] = countMap[arr[i]] ? countMap[arr[i]] + 1 : 1;
    }

    // Находим элемент с максимальным количеством вхождений
    // Finding element with max count
    let maxCount = 0;
    let maxItem = null;
    for (const item in countMap) {
        if (countMap.hasOwnProperty(item)) {
            const count = countMap[item];
            if (maxCount < count) {
                maxCount = count;
                maxItem = item;
            }
        }
    }


    return maxItem;
}

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

export const gameStarts = async (interaction, gameId) => {

    const serverDiscordId = interaction.guildId;
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


export const nextStage = (interaction, gameId, client, callback) => {
    const serverDiscordId = interaction.guildId;

    // Get the current stage of the game
    pool.query('SELECT gamestage, gameday FROM games WHERE gameid = ?', [gameId], async (error, results) => {
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

        const gameDay = await gameState.getGameDay(gameId);

        if (currentStage.gamestage === 0) {
            // It's currently day, switch to night
            query = 'UPDATE games SET gamestage = 1 WHERE gameid = ?';
            queryParams = [gameId];
            await gameState.setGameStage(gameId, 1);
            gameEvents.emit('stageUpdate', {
                gameId,
                currentStage: 1,
                currentDay: gameDay
            });
        } else {
            // It's currently night, increment day and switch to day
            query = 'UPDATE games SET gamestage = 0, gameday = gameday + 1 WHERE gameid = ?';
            queryParams = [gameId];
            await gameState.setGameStage(gameId, 0);
            await gameState.setGameDay(gameId, gameDay + 1);
            gameEvents.emit('stageUpdate', {
                gameId,
                currentStage: 0,
                currentDay: gameDay + 1
            });
            gameEvents.emit('dayUpdate', {
                gameId,
                currentDay: gameDay + 1,
                client: client
            });
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

// get gameday
export const getGameDay = async (interaction, gameId) => {
    return await gameState.getGameDay(gameId);
};

// send doctorChannelId and other channel ids to the database to tables games
export const sendChannelIdsToDatabase = async (gameId, mafiaChannelId, doctorChannelId, detectiveChannelId, maniacChannelId) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query('UPDATE games SET gamedoctorchid = ?, gamedetectivechid = ?, gamemafiachid = ?, gamemaniacchid = ? WHERE gameid = ?', [doctorChannelId, detectiveChannelId, mafiaChannelId, maniacChannelId, gameId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);

            }
        });
    });
}

// check if the user is in the table user_items and if not then add him
export const checkUserInDatabaseItems = async (userDiscordId) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query('SELECT userid FROM user_items WHERE userid = ?', [userDiscordId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);
                return;
            }
            if (rows.length === 0) {
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    connection.query('INSERT user_items SET userid = ?', [userDiscordId], async (err, rows) => {
                        connection.release();
                        if (err) {
                            console.error(err);

                        }
                    });
                });
            }
        });
    });
}

// buy items from the shop (user_items table)
export const takeCoinsFromDatabase = async (userDiscordId, item) => {

    let price;
    console.log('item: ', item)

    switch (item) {
        case 'activerole':
            price = '1000';
            break;
        case 'fakedocuments':
            price = '250';
            break;
        case 'knife':
            price = '6450';
            break;
        default:
            price = '0';
    }

    console.log('price: ', price)

    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query(`UPDATE user_items SET coins = coins - ? WHERE userid = ?`, [price, userDiscordId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);
                return;
            }
            return true;
        });
    });
}

// check user's items
export const checkUserItems = async (userDiscordId) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            connection.query('SELECT * FROM user_items WHERE userid = ?', [userDiscordId], (err, rows) => {
                connection.release();
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                console.log(rows[0]);
                resolve(rows[0]);
            });
        });
    });

}

// add items to the user (user_items table)
export const addItemToUser = async (userDiscordId, item) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query(`UPDATE user_items SET ${item} = ${item} + 1 WHERE userid = ?`, [userDiscordId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);

            }
        });
    });
}

// subsctract items from the user (user_items table)
export const subtractItemFromUser = async (userDiscordId, item) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query(`UPDATE user_items SET ${item} = ${item} - 1 WHERE userid = ?`, [userDiscordId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);

            }
        });
    });

}

// add coins to the user (user_items table)
export const addCoinsToUser = async (userDiscordId, coins) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query(`UPDATE user_items SET coins = coins + ? WHERE userid = ?`, [coins, userDiscordId], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);

            }
        });
    });
}


// get player coins from the database table user_items
export const getPlayerCoinsFromDatabase = async (userDiscordId) => {
    console.log(userDiscordId)
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error(err);
                reject(err);
            }

            connection.query('SELECT coins FROM user_items WHERE userid = ?', [userDiscordId], (err, rows) => {
                connection.release();
                if (err) {
                    console.error(err);
                    reject(err);
                }

                console.log(rows)

                if (rows[0].length !== 0) {
                    if (rows[0].coins === null) {
                        resolve(1);
                    } else {
                        resolve(rows[0].coins);
                    }
                }
            });
        });
    });
}

// get the channel ids from the database promise
export const getChannelIdsFromDatabase = async (gameId) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            connection.query('SELECT gamedoctorchid, gamedetectivechid, gamemafiachid, gamemaniacchid FROM games WHERE gameid = ?', [gameId], (err, rows) => {
                connection.release();
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                console.log(rows[0]);
                resolve(rows[0]);
            });
        });
    });
}


// night_actions table row creation with gameid and gameday
export const createNightActionsRow = async (gameId, gameDay) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return;
        }

        connection.query('INSERT night_actions SET gameid = ?, gameday = ?', [gameId, gameDay], async (err, rows) => {
            connection.release();
            if (err) {
                console.error(err);

            }
        });
    });
}

export const addTargetToDatabase = async (gameDay, gameId, targetColumn, targetUserId) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Connection Error:', err);
                reject(err);
                return;
            }

            gameState.addNightVote(gameId, gameDay, targetColumn, targetUserId);

            const query = `
                INSERT INTO night_actions (gameid, gameday, ${connection.escapeId(targetColumn)}) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE ${connection.escapeId(targetColumn)} = ?;
            `;
            connection.query(query, [gameId, gameDay, targetUserId, targetUserId], (err, rows) => {
                if (err) {
                    console.error('Query Error:', err);
                    reject(err);
                    return;
                }
                console.log('Query Success:', rows);
                resolve(rows);
                connection.release();
            });
        });
    });
};

// night actions table update
export const processNightActions = async (gameId, day) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if (err) {
                console.error('Connection Error:', err);
                reject(err);
                return;
            }

            // Query to get night actions for the game
            connection.query('SELECT * FROM night_actions WHERE gameid = ?', [gameId], async (err, rows) => {
                if (err) {
                    console.error('Query Error:', err);
                    connection.release();
                    reject(err);
                    return;
                }

                if (rows.length === 0) {
                    console.log('No night actions found for gameId:', gameId);
                    connection.release();
                    resolve({});
                    return;
                }

                //const nightActions = rows[0];
                const gameDay = await gameState.getGameDay(gameId);
                const nightActions = await gameState.getNightVote(gameId, gameDay);
                connection.release();

                // Initialize results variables
                let mafiaActionResult = null;
                let maniacActionResult = null;
                let doctorActionResult = null;
                let detectiveActionResult = null;

                if (nightActions) {
                    const mafiaAction = nightActions.filter(action => action.voter === "gamemafiatarget")[0];
                    const maniacAction = nightActions.filter(action => action.voter === "gamemaniactarget")[0];
                    const detectiveAction = nightActions.filter(action => action.voter === "gamedetectivetarget")[0];
                    const doctorAction = nightActions.filter(action => action.voter === "gamedoctortarget")[0];

                    if (mafiaAction) {
                        if (doctorAction) {
                            // Process Mafia action
                            if (mafiaAction.target !== doctorAction.target) {
                                // Mafia's target was not saved by the doctor
                                mafiaActionResult = {
                                    success: true,
                                    target: mafiaAction.target
                                };

                            } else {
                                // Mafia's target was saved by the doctor
                                mafiaActionResult = {
                                    success: false,
                                    target: mafiaAction.target
                                };
                            }
                        } else {
                            mafiaActionResult = {
                                success: true,
                                target: mafiaAction.target
                            };
                        }
                    }

                    // maniac
                    if (maniacAction) {
                        if (doctorAction) {
                            // Process Mafia action
                            if (maniacAction.target !== doctorAction.target) {
                                // Mafia's target was not saved by the doctor
                                maniacActionResult = {
                                    success: true,
                                    target: maniacAction.target
                                };

                            } else {
                                // Mafia's target was saved by the doctor
                                maniacActionResult = {
                                    success: false,
                                    target: maniacAction.target
                                };
                            }
                        } else {
                            maniacActionResult = {
                                success: true,
                                target: maniacAction.target
                            };
                        }
                    }

                    if (doctorAction) {
                        // Process Doctor action
                        doctorActionResult = {
                            saved: doctorAction.target
                        };
                    } else {
                        doctorActionResult = {
                            saved: null
                        };
                    }

                    // Process Detective action
                    try {
                        if (detectiveAction.target) {
                            const detectiveTargetRole = await gameState.getRole(gameId, detectiveAction.target);
                            detectiveActionResult = {
                                checked: detectiveAction.target,
                                role: `${detectiveTargetRole}` || 'An error occurred'
                            };
                        }
                    } catch (error) {
                        console.log('Something went wrong with the detective. Please, try again.\n\n' + error);
                    }

                    // Resolve the promise with the results
                    resolve({
                        mafiaActionResult,
                        doctorActionResult,
                        detectiveActionResult,
                        maniacActionResult,
                        detectiveChannelId: gameState.getDetectiveChannel(gameId)
                    });
                } else {
                    resolve({
                        mafiaActionResult: "123",
                        doctorActionResult: "1234",
                        detectiveActionResult: "1235",
                        detectiveChannelId: gameState.getDetectiveChannel(gameId)
                    });
                }
            });
        });
    });
};

// daily vote table
export const addDailyVoteToDatabase = async (gameDay, gameId, voterUserId, targetUserId) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Connection Error:', err);
                reject(err);
                return;
            }

            gameState.addVote(gameId, gameDay, voterUserId, targetUserId);

            // Assuming the table for daily voting is called 'day_votes'
            // and there is a 'voterid' column to store the ID of the user who is voting.
            const query = `
                INSERT INTO daily_vote (gameid, gameday, voterid, targetid) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE targetid = ?;
            `;
            connection.query(query, [gameId, gameDay, voterUserId, targetUserId, targetUserId], (err, rows) => {
                if (err) {
                    console.error('Query Error:', err);
                    reject(err);
                    return;
                }
                console.log('Query Success:', rows);
                resolve(rows);
                connection.release();
            });
        });
    });
};

// process daily vote (which target id is the most popular and return it (one))
export const processDailyVote = async (gameId, gameday) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Connection Error:', err);
                reject(err);
                return;
            }

            // Query to get daily votes for the game
            connection.query('SELECT * FROM daily_vote WHERE gameid = ? AND gameday = ?', [gameId, gameday], async (err, rows) => {
                if (err) {
                    console.error('Query Error:', err);
                    connection.release();
                    reject(err);
                    return;
                }

                // Initialize results variables
                let mostVotedTargetId = null;
                let mostVotes = 0;

                let votedForIds = [];

                const gameDay = await gameState.getGameDay(gameId);
                const votes = await gameState.getVote(gameId, gameDay)
                console.log('gameday votes: ' + gameday)
                console.log('gameday votes: ' + gameday)
                console.log('gameday votes: ' + gameday)

                if (!votes) {
                    resolve({
                        mostVotedTargetId: "nobody",
                        mostVotes: 0,
                    });
                } else {
                    votes.forEach(vote => votedForIds.push(vote.target))

                    mostVotedTargetId = mostElementInArray(votedForIds);

                    // Resolve the promise with the results
                    resolve({
                        mostVotedTargetId,
                        mostVotes,
                    });
                }
            });
        });
    });
}