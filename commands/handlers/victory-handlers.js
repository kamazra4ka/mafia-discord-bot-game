import gameState from "../../src/gameState.js";
import {getChannelIdsFromDatabase} from "./database-handlers.js";
import {sendDetectiveVote, sendDoctorVote, sendMafiaVote} from "./privateChannel-handlers.js";

export const checkVictory = async (gameId, client) => {

    // get alive players
    const alivePlayers = await gameState.getAlivePlayersList(gameId);

    // get mafias
    const mafias = await gameState.getUsersByRole(gameId, 'mafia');

    // get civilians + detectives + doctors
    const civilians = await gameState.getUsersByRole(gameId, 'civilian');
    const detectives = await gameState.getUsersByRole(gameId, 'detective');
    const doctors = await gameState.getUsersByRole(gameId, 'doctor');

    const peacefuls = [...civilians, ...detectives, ...doctors];

    // if all mafias are dead, civilians win
    if (mafias.every(mafia => !alivePlayers.includes(mafia))) {
        await victoryHandler(gameId, 'civilian', client);
        return true;
    }

    // if all peacefuls are dead, mafias win
    if (peacefuls.every(peaceful => !alivePlayers.includes(peaceful))) {
        await victoryHandler(gameId, 'mafia', client);
        return true;
    }

}

export const victoryHandler = async (gameId, type, client) => {

    // delete private channels
    await getChannelIdsFromDatabase(gameId).then(async channelIds => {

        console.log('channelIds:', channelIds)
        console.log('channelIds.gamemafiachid:', channelIds.gamemafiachid)
        console.log('channelIds.gamedoctorchid:', channelIds.gamedoctorchid)

        // fetch channels from channelids
        const mafiaChannel = await client.channels.fetch(channelIds.gamemafiachid);
        const doctorChannel = await client.channels.fetch(channelIds.gamedoctorchid);
        const detectiveChannel = await client.channels.fetch(channelIds.gamedetectivechid);

        // delete channels
        await mafiaChannel.delete();
        await doctorChannel.delete();
        await detectiveChannel.delete();
    });

    if (type === 'civilian') {
        console.log('Civilians win!');
    } else if (type === 'mafia') {
        console.log('Mafias win!');
    }

}