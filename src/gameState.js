// gameState.js
class GameState {
    constructor() {
        this.games = new Map(); // Maps gameId to game info
    }

    addPlayer(gameId, userId) {
        const game = this.getGame(gameId);

        if (userId) {
            game.roles[userId] = null;
        } else {
            console.error('Attempted to add invalid userId:', userId);
            return; // Add this line to prevent adding undefined users
        }

        if (!game) {
            throw new Error('Game not found.');
        }
    }


    async assignRoles(gameId) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error('Game not found.');
        }

        const players = Object.keys(game.roles).filter(playerId => playerId);

        // Shuffle and assign roles
        const roles = {
            mafia: 1,
            doctor: 1,
            detective: 0,
            civilian: players.length - 2 // Rest are civilians by default
        };

        if (players.length >= 7 && players.length <= 13) {
            roles.mafia = 2;
            roles.detective = 1;
            roles.civilian = players.length - 4;
        } else if (players.length >= 14 && players.length <= 20) {
            roles.mafia = 3;
            roles.detective = 1;
            roles.civilian = players.length - 5;
        } else if (players.length >= 21 && players.length <= 32) {
            roles.mafia = 4;
            roles.detective = 1;
            roles.civilian = players.length - 6;
        }

        const shuffledPlayers = players.sort(() => 0.5 - Math.random());
        const updatePromises = [];

        // Assign special roles using for loop and store promises
        for (let i = 0; i < roles.mafia; i++) {
            updatePromises.push(this.updateRole(gameId, shuffledPlayers.pop(), 'mafia'));
        }
        for (let i = 0; i < roles.doctor; i++) {
            updatePromises.push(this.updateRole(gameId, shuffledPlayers.pop(), 'doctor'));
        }
        if (roles.detective > 0) {
            updatePromises.push(this.updateRole(gameId, shuffledPlayers.pop(), 'detective'));
        }

        // Assign civilian roles to the rest and store promises
        shuffledPlayers.forEach(playerId => {
            updatePromises.push(this.updateRole(gameId, playerId, 'civilian'));
        });

        // Wait for all role updates to complete
        await Promise.all(updatePromises);
    }

    setGame(gameId, gameInfo) {
        this.games.set(gameId, gameInfo);
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    async updateRole(gameId, userId, role) {
        const game = this.getGame(gameId);
        if (game) {
            // Update role information for the user
            game.roles[userId] = role;
        }
    }

    async getRole(gameId, userId) {
        const game = this.getGame(gameId);
        if (game) {
            return game.roles[userId];
        }
    }

    async getUsersByRole(gameId, role) {
        const game = this.getGame(gameId);
        if (game) {
            return Object.keys(game.roles).filter(userId => game.roles[userId] === role);
        }
    }

    // get alive players (all dead users have a role of 'dead')
    async getAlivePlayersList(gameId) {
        const game = this.getGame(gameId);
        if (game) {
            return Object.keys(game.roles).filter(userId => game.roles[userId] !== 'dead');
        }
    }

}

// Export a singleton instance
const gameState = new GameState();
export default gameState;
