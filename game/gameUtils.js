import addData from '../firebase/firestore/addData';
import getData from '../firebase/firestore/getData';
import updateData from '../firebase/firestore/updateData';

import { where } from 'firebase/firestore';
import searchDocuments from '../firebase/firestore/searchDocuments';

export const createGame = async (isPublic) => {
    const initialGameData = {
        public: isPublic,
        in_progress: false,
        players: Array(4).fill(null)
    };

    return await addData('games', initialGameData);
};

export const playerJoin = async (gameId, nickname) => {
    // Get game data
    const gameData = await getData('games', gameId);
    if (!gameData) {
        return { error: 'Couldn\'t be find a game with the provided ID.' };
    }

    // Check if the game is in progress
    if (gameData.in_progress) {
        return { error: 'The game already started.' }
    }

    // Check if the nickname is already in use within the game
    const existingPlayer = gameData.players.find(player => player && player.nickname === nickname);
    if (existingPlayer) {
        return { error: 'Nickname is already in use in this game. Please choose a different nickname.' };
    }

    // Find an empty player slot
    const emptyPlayerSlotIndex = gameData.players.findIndex(player => player === null);

    if (emptyPlayerSlotIndex !== -1) {
        // Generate a random number between 1 and 100
        const randomValue = Math.floor(Math.random() * 100) + 1;

        // Assign player data to the empty slot
        gameData.players[emptyPlayerSlotIndex] = {
            nickname: nickname,
            cardNumber: randomValue,
            cardPlacementOrder: 0
        };
    } else {
        return { error: 'The game is full. Cannot join.' };
    }

    // Update game data
    if (!await updateData('games', gameId, gameData)) {
        return false;
    }

    return emptyPlayerSlotIndex + 1;
};

export const findGame = async () => {
    const conditions = [
        where('in_progress', '==', false),
        where('public', '==', true),
    ];
    const results = await searchDocuments('games', conditions);

    let gameId;
    if (results.length === 0) {
        gameId = await createGame(true);
    } else {
        gameId = results[0].id;
    }

    return gameId;
};

export default { createGame, playerJoin, findGame };