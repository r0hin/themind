"use client";

import { useState, useEffect } from 'react';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Image from 'next/image';

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

const inputClass = "bg-transparent py-2 px-4 border-4 border-amber-500 placeholder-amber-100 text-lg font-bold rounded-xl outline-none focus:bg-amber-600 focus:placeholder-white transition";
const buttonClass = "py-2 px-4 text-lg font-bold rounded-xl transition";

export default function Home() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(0);

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

  const notifyError = (message) => {
    toast.error(message);
  };

  const handleAction = async (type) => {
    if (!user) {
      notifyError('Anonymous login failed. Refresh or try again later.');
      return;
    }

    // Check if a nickname is provided
    if (nickname === '') {
      notifyError('Enter a nickname.');
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
          notifyError('Provide a Game ID.');
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
          notifyError(joinedPlayer.error);
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
    <>
      {game === null ? (
        <div>
          <Image src="/logo.png" width="437" height="173" alt="The Mind" className="mx-auto" />

          <div className="w-full max-w-[25rem] px-6 mt-16">
              <div className="flex flex-col space-y-3">
                  <input
                      type="text"
                      placeholder="Nickname"
                      className={inputClass}
                      onKeyUp={handleNicknameChange}
                  />

                  <button
                      className={`border-4 border-red-500 bg-red-500 hover:bg-red-600 ${buttonClass}`}
                      onClick={() => handleAction(1)}
                  >
                      { loading === 1 ? 'Creating new game...' : 'Start a new game' }
                  </button>
                  <button
                      className={`border-4 border-green-500 bg-green-500 hover:bg-green-600 ${buttonClass}`}
                      onClick={() => handleAction(2)}
                  >
                      { loading === 2 ? 'Finding game...' : 'Find a game' }
                  </button>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Game ID"
                      className={`${inputClass} border-sky-500 placeholder-sky-100 focus:bg-sky-600`}
                      onKeyUp={handleJoinIdChange}
                    />
                    <button
                      className={`border-4 border-sky-500 bg-sky-500 hover:bg-sky-600 ${buttonClass}`}
                      onClick={() => handleAction(3)}
                    >
                      {loading === 3 ? 'Joining game...' : 'Join a game'}
                    </button>
                  </div>
              </div>
          </div>
        </div>
      ) : null}

      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        draggable={false}
        theme="dark"
      />
    </>
  );
}