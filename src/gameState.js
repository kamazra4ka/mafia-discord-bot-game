// gameState.js
class GameState {
    constructor() {
        this.games = new Map(); // Maps gameId to game info
    }

    addPlayer(gameId, userId) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error('Game not found.');
        }
        // Initialize the player's role as null
        game.roles[userId] = null;
    }

    assignRoles(gameId) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error('Game not found.');
        }

        // Get player IDs as an array
        const players = Object.keys(game.roles).filter(key => key && game.roles[key]);

        // if undefined remove it
        players.forEach(playerId => {
            if (!playerId) {
                players.splice(players.indexOf(playerId), 1);
            }
        });

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

        // Assign special roles
        for (let i = 0; i < roles.mafia; i++) this.updateRole(gameId, shuffledPlayers.pop(), 'mafia');
        for (let i = 0; i < roles.doctor; i++) this.updateRole(gameId, shuffledPlayers.pop(), 'doctor');
        if (roles.detective) this.updateRole(gameId, shuffledPlayers.pop(), 'detective');

        // Assign civilian roles to the rest
        shuffledPlayers.forEach(playerId => this.updateRole(gameId, playerId, 'civilian'));
    }

    setGame(gameId, gameInfo) {
        this.games.set(gameId, gameInfo);
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    updateRole(gameId, userId, role) {
        const game = this.getGame(gameId);
        if (game) {
            // Update role information for the user
            game.roles[userId] = role;
        }
    }

}

// Export a singleton instance
const gameState = new GameState();
export default gameState;
