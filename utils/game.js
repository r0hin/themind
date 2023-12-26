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
  const createdAt = await getTimestamp();

  const docRef = await addDoc(collection(db, 'games'), {
    public: Boolean(isPublic),
    status: Number(0),
    players: Array(),
    playersSummary: Array(4).fill(null),
    places: Array(),
    timerTo: Number(0),
    createdAt: Number(createdAt)
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

  let randomNumber;
  let isNumberUnique = false;

  // Keep generating random numbers until a unique one is found
  while (!isNumberUnique) {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    isNumberUnique = !data.playersSummary.some(player => player && player.number === randomNumber);
  }

  // Assign player data to the empty slot
  data.players.push(user?.uid);
  data.playersSummary[emptyPlayerSlotIndex] = {
    nickname,
    number: randomNumber,
    ready: false
  };

  setTimeLeft(0);

  // Start the game if there are 4 players
  switch (emptyPlayerSlotIndex) {
    case 1: {
      data.timerTo = await getTimestamp() + 45;
      break;
    }
    case 2: {
      data.timerTo = await getTimestamp() + 20;
      break;
    }
    case 3: {
      data.timerTo = await getTimestamp() + 5;
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

  data.timerTo = await getTimestamp() + 60;
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

export const placeCard = async (game, player) => {
  const id = game.id;
  const data = game.data();
  const docRef = doc(db, 'games', id);

  const playerIndex = player - 1;

  if (data.places.includes(playerIndex)) return;

  data.places.push(playerIndex);

  if (data.places.length === data.players.length) {
    data.status = ascendingOrder(data) ? 2 : 3;
  }

  // Update game data
  await updateDoc(docRef, data);

  if (data.status > 1) {
    await stopGame(game);
  }
}

export const stopGame = async (game, timeLeft = false) => {
  const id = game.id;
  const data = game.data();

  if (timeLeft) {
    const docRef = doc(db, 'games', id);

    data.status = ascendingOrder(data) ? 2 : 3;
    
    // Update game data
    await updateDoc(docRef, data);
  }

  setTimeout(async () => {
    await deleteGame(id);
  }, 3000);
}

export const ready = async (game, player) => {
  const id = game.id;
  const data = game.data();
  const docRef = doc(db, 'games', id);
    
  const playerIndex = player - 1;

  data.playersSummary[playerIndex].ready = !data.playersSummary[playerIndex].ready;

  // Check if all players are ready
  const allPlayersReady = data.playersSummary.filter(player => player !== null).every(player => player.ready);

  if (allPlayersReady && data.players.length >= 2 && data.timerTo - await getTimestamp() > 10) {
    data.timerTo = await getTimestamp() + 10;
  }

  // Update game data
  await updateDoc(docRef, data);
}

const ascendingOrder = (data) => {
  const { playersSummary, places } = data;

  // Check for null values and invalid array length
  if (!playersSummary || !places || places.length < 2) {
    return false;
  }

  for (let i = 1; i < places.length; i++) {
    // Check for null values in players array
    if (!playersSummary[places[i - 1]] || !playersSummary[places[i]]) {
      return false;
    }

    if (playersSummary[places[i - 1]].number > playersSummary[places[i]].number) {
      return false;
    }
  }

  return true;
}

const deleteGame = async (id) => {
  await deleteDoc(doc(db, 'games', id));
};
