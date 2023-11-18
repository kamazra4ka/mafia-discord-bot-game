import { EventEmitter } from 'events';

// Create a class that extends EventEmitter
class GameEventEmitter extends EventEmitter {}

// Instantiate an emitter for game events
const gameEvents = new GameEventEmitter();

export default gameEvents;