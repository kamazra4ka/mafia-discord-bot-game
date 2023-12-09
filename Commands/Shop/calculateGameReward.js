import {
    addCoinsToUser,
    getGameDay
} from "../Handlers/DatabaseHandlers.js";
import gameState from "../../src/gameState.js";

export const calculateGameReward = async (gameId, victorySide, userId) => {

    let userReward, roleReward, dayReward
    const gameDay = await getGameDay(gameId);
    const userRole = await gameState.getRole(gameId, userId);

    if (victorySide === 'mafia') {
        try {
            if (userRole === 'mafia') {
                roleReward = 350;
                dayReward = gameDay * 30;
            }

            if (userRole === 'doctor') {
                roleReward = 10;
                dayReward = gameDay * 4;
            }

            if (userRole === 'detective') {
                roleReward = 10;
                dayReward = gameDay * 5;
            }

            if (userRole === 'civilian') {
                roleReward = 5;
                dayReward = gameDay * 2;
            }

            if (userRole === 'dead') {
                roleReward = 0;
                dayReward = gameDay * 5;
            }

            // calculate user reward
            userReward = roleReward + dayReward;
        } catch (error) {
            const channel = await client.channels.fetch('1180826418523942922');
            channel.send('Something went wrong. Please, try again.\n\n' + error);
        }
    } else if (victorySide === 'civilian') {
        try {
            if (userRole === 'mafia') {
                roleReward = 10;
                dayReward = gameDay * 5;
            }

            if (userRole === 'doctor') {
                roleReward = 150;
                dayReward = gameDay * 10;
            }

            if (userRole === 'detective') {
                roleReward = 200;
                dayReward = gameDay * 12;
            }

            if (userRole === 'civilian') {
                roleReward = 50;
                dayReward = gameDay * 5;
            }

            if (userRole === 'dead') {
                roleReward = 0;
                dayReward = gameDay * 5;
            }

            // calculate user reward
            userReward = roleReward + dayReward;
        } catch (error) {
            const channel = await client.channels.fetch('1180826418523942922');
            channel.send('Something went wrong. Please, try again.\n\n' + error);
        }
    } else {
        try {

        } catch (error) {
            const channel = await client.channels.fetch('1180826418523942922');
            channel.send('Something went wrong. Please, try again.\n\n' + error);
        }
    }

    // add coins to the user
    await addCoinsToUser(userId, userReward);
    return userReward;
}