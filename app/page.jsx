"use client";

import { useState, useEffect } from 'react';
import { subscribeToAuthChanges } from '@/utils/auth';
import {
  findGame,
  createGame,
  joinGame,
  startGame,
  getGame,
  placeCard,
  stopGame,
  ready
} from '@/utils/game';
import { getTimestamp } from '@/utils/date';
 
const BUTTON_CLASS = "bg-sky-500 p-2 rounded text-white";
const BORDER_CLASS = "border p-2 rounded focus:outline-0 focus:border-green-500 transition";

export default function Home() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [nickname, setNickname] = useState('');
  const [joinId, setJoinId] = useState('');

  const [player, setPlayer] = useState(null);
  const [game, setGame] = useState(null);

  const [timeLeft, setTimeLeft] = useState(0);

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
  };

  const handleJoinIdChange = (e) => {
    setJoinId(e.target.value);
  };

  const handleAction = async (type) => {
    if (!user) {
      setErrorMessage('Anonymous login failed. Refresh or try again later.');
      return;
    }

    // Check if a nickname is provided
    if (nickname === '') {
      setErrorMessage('Enter a nickname.');
      return;
    }

    setLoading(type);

    let gameId;

    switch (type) {
      case 1: { // Find a game
        gameId = await findGame();

        if (gameId === null) {
          gameId = await createGame(true);
        }
        break;
      }
      case 2: { // Start a new game
        gameId = await createGame(false);
        break;
      }
      case 3: { // Join game by ID
        if (joinId === '') {
          setErrorMessage('Provide a Game ID.');
          setLoading(0);
          return;
        }

        gameId = joinId;
        break;
      }
    }
    
    let joinedPlayer;

    while (true) {
      joinedPlayer = await joinGame(gameId, nickname, setTimeLeft, user);
      
      if (type === 1) {
        if (joinedPlayer.error) {
          gameId = await createGame(true);
        } else {
          break;
        }
      } else {
        if (joinedPlayer.error) {
          setErrorMessage(joinedPlayer.error);
          setLoading(0);
          return;
        } else {
          break;
        }
      }
    }

    // Set player and get real-time game updates
    setPlayer(joinedPlayer);
    getGame(gameId, setGame, reset);

    setLoading(0);
  };

  const handleReady = async () => {
    await ready(game, player);
  };

  const handlePlace = async () => {
    await placeCard(game, player);
  };

  const reset = () => {
    setLoading(0);
    setErrorMessage('');

    setNickname('');
    setJoinId('');

    setPlayer(null);
    setGame(null);

    setTimeLeft(0);
  };

  useEffect(() => {
    let interval;
    let remainingTime;

    const updateTimer = async () => {
      if (game.data().status < 2) { // No longer decrease the timer if the game is finished (win or lose)

        remainingTime = game.data().timerTo - await getTimestamp();
        setTimeLeft(remainingTime);

        if (remainingTime <= 0) {
          if (game.data().status === 0) {
            await startGame(game);
          } else if (game.data().status === 1) { // Time left
            await stopGame(game);
          }

          clearInterval(interval);
        }

      }
    }

    // Check if the game exists and has a timer
    if (game !== null && game.data().timerTo !== 0) {
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }

    // Cleanup function to clear the timer interval
    return () => {
      clearInterval(interval);
    }
  }, [game]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((newUser) => {
      setUser(newUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="m-2">
      {game === null ? (
        <div>
          <input
            type="text"
            placeholder="Nickname"
            className={BORDER_CLASS}
            onKeyUp={handleNicknameChange}
          />

          <div className="mt-2 space-x-2">
            <button className={BUTTON_CLASS} onClick={() => handleAction(1)}>
              {loading === 1 ? 'Finding a game...' : 'Find a game'}
            </button>

            <button className={BUTTON_CLASS + ' !bg-red-500 mt-2'} onClick={() => handleAction(2)}>
              {loading === 2 ? 'Starting a new game...' : 'Start a new game'}
            </button>
          </div>

          <div className='mt-2 space-x-2'>
            <input
              type="text"
              placeholder="Game ID"
              className={BORDER_CLASS}
              onKeyUp={handleJoinIdChange}
            />

            <button className={BUTTON_CLASS + ' !bg-green-500 mt-2'} onClick={() => handleAction(3)}>
              {loading === 3 ? 'Joining the game...' : 'Join a game'}
            </button>
          </div>

          {errorMessage && <p className="mt-2 text-red-500">{errorMessage}</p>}
        </div>
      ) : null}

      {/* Display when the game is waiting for players */}
      {game?.data().status === 0 ? (
        <div>
          <p>ID: {game.id}</p>
          <p>Waiting for players...</p>
          <p>Starting in {timeLeft > 0 ? timeLeft : 0} seconds.</p>

          <button className={`${BUTTON_CLASS} mt-2`} onClick={handleReady}>
            {game.data().playersSummary[player - 1].ready ? 'Unready' : 'Ready'}
          </button>

          <ul className={BORDER_CLASS + " mt-2"}>
            {game.data().playersSummary
              .filter((player) => player !== null)
              .map((player, index) => (
                <li key={index}>{player.nickname} {player.ready ? (<span className="text-green-500">Ready</span>) : (<span className="text-red-500">Not ready</span>)}</li>
              ))}
          </ul>
        </div>
      ) : null}

      {/* Display when the game is in progress or has ended */}
      {game?.data().status > 0 ? (
        <div>
          <p>
            Your card number is {game.data().playersSummary[player - 1].number}.
          </p>
          <p>Ends in {timeLeft > 0 ? timeLeft : 0} seconds.</p>

          {game.data().status > 1 ? (
            <p>
              Result: {game.data().status === 2 ? (<span className="text-green-500">Win</span>) : (<span className="text-red-500">Lose</span>)}
            </p>
          ) : null}

          <button className={`${BUTTON_CLASS} mt-2`} onClick={handlePlace}>
            Place
          </button>

          <ul className={BORDER_CLASS + " mt-2"}>
            {game.data().places.map((place, index) => (
              <li key={index}>{`${game.data().playersSummary[place].nickname} placed card.`}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}