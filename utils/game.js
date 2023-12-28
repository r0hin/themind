import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';

import { getTimestamp } from './date';

export const findGame = async () => {
  const q = query(collection(db, 'games'), where('status', '==', 0), where('public', '==', true));

  const querySnapshot = await getDocs(q);
  if (querySnapshot.size > 0) {
    return querySnapshot.docs[0].id;
  }

  return null;
};

export const createGame = async (isPublic = true) => {
  const docRef = await addDoc(collection(db, 'games'), {
    public: isPublic,
    status: 0,
    players: [],
    playersSummary: [
      null,
      null,
      null,
      null
    ],
    places: [],
    timerTo: 0
  });

  return docRef.id;
};

export const joinGame = async (id, nickname, setTimeLeft, user) => {
  const docRef = doc(db, 'games', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return { error: 'Couldn\'t find a game with the provided ID.' };
  }

  const data = docSnap.data();

  // Check if the game is in progress
  if (data.status > 0) {
    return { error: 'The game has already started.' };
  }

  // Check if the nickname is already in use within the game
  const existingPlayer = data.playersSummary.find(player => player && player.nickname === nickname);
  if (existingPlayer) {
    return { error: 'Nickname is already in use in this game. Please choose a different nickname.' };
  }

  // Check if the user's UID is already in the players array
  if (data.players.includes(user?.uid)) {
    return { error: 'You are already in this game.' };
  }

  // Find an empty player slot
  const emptyPlayerSlotIndex = data.playersSummary.findIndex(player => player === null);

  if (emptyPlayerSlotIndex === -1) {
    return { error: 'The game is full. Cannot join.' };
  }

  let randomNumber = generateCard(data);

  // Assign player data to the empty slot
  data.players.push(user?.uid);
  data.playersSummary[emptyPlayerSlotIndex] = {
    nickname,
    numbers: [randomNumber],
    ready: false
  };

  setTimeLeft(0);

  // Start the game if there are 4 players
  switch (emptyPlayerSlotIndex) {
    case 1: {
      data.timerTo = getTimestamp() + 45;
      break;
    }
    case 2: {
      data.timerTo = getTimestamp() + 20;
      break;
    }
    case 3: {
      data.timerTo = getTimestamp() + 5;
      break;
    }
  }

  // Update game data
  await updateDoc(docRef, data);

  return emptyPlayerSlotIndex + 1;
};

export const startGame = async (game) => {
  const id = game.id;
  const data = game.data();
  const docRef = doc(db, 'games', id);

  data.timerTo = getTimestamp() + 60;
  data.status = 1;

  // Update game data
  await updateDoc(docRef, data);
};

// Get real-time updates for a specific game
export const getGame = (id, setGame, reset) => {
  const docRef = doc(db, 'games', id);

  const unsub = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      setGame(doc);
    } else {
      reset();
      unsub();
    }
  });

  return unsub;
};

export const placeCardInGame = async (game, player, number) => {
  const id = game.id;
  const data = game.data();
  const docRef = doc(db, 'games', id);

  const playerIndex = player - 1;

  if (data.status > 1) return;
  if (data.places.includes(playerIndex)) return;

  // Count the total number of elements across all players
  const totalNumbers = data.playersSummary.filter(player => player !== null).flatMap(player => player.numbers).length;

  if (data.places.length + 1 === totalNumbers) {
    data.status = 2;
  }
  
  // Check if the last placed card's number is greater than the current placed card's number
  if (data.places[data.places.length - 1]?.number > number) {
    data.status = 3;
  }

  data.places.push({
    player: playerIndex,
    number
  });

  await updateDoc(docRef, data);

  // Add a delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Win -> upgrade level
  if (data.status === 2) {
    data.places = [];

    for (let i = 0; i < data.playersSummary.length; i++) {
      const player = data.playersSummary[i];

      if (player !== null) {
        const currentLevel = player.numbers.length;
        player.numbers = [];

        for (let j = 0; j < currentLevel + 1; j++) {
          let randomNumber = generateCard(data);
          player.numbers.push(randomNumber);
        }
      }
    }

    data.timerTo = getTimestamp() + 60;
    data.status = 1;

    // Update game data again after the delay
    await updateDoc(docRef, data);
  }
  // Lose -> delete game
  else if (data.status === 3) {
    await deleteGame(game.id);
  }
};

export const ready = async (game, player) => {
  const id = game.id;
  const data = game.data();
  const docRef = doc(db, 'games', id);
    
  const playerIndex = player - 1;

  data.playersSummary[playerIndex].ready = !data.playersSummary[playerIndex].ready;

  // Check if all players are ready
  const allPlayersReady = data.playersSummary.filter(player => player !== null).every(player => player.ready);

  if (allPlayersReady && data.players.length >= 2 && data.timerTo - getTimestamp() > 10) {
    data.timerTo = getTimestamp() + 10;
  }

  // Update game data
  await updateDoc(docRef, data);
}

const generateCard = (data) => {
  let randomNumber;
  let isNumberUnique = false;

  // Keep generating random numbers until a unique one is found
  while (!isNumberUnique) {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    isNumberUnique = !data.playersSummary.some(player => player && player.numbers.includes(randomNumber));
  }

  return randomNumber;
}

export const deleteGame = async (id) => {
  await deleteDoc(doc(db, 'games', id));
};
