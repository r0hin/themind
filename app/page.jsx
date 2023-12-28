"use client";

import { useState, useEffect } from 'react';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CiUser } from 'react-icons/ci';
import { GoClock } from 'react-icons/go';

import Image from 'next/image';

import { subscribeToAuthChanges } from '@/utils/auth';
import {
  findGame,
  createGame,
  joinGame,
  startGame,
  getGame,
  placeCardInGame,
  deleteGame,
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
    else if (nickname.length > 12) {
      notifyError('The nickname must not exceed 12 characters.');
      return;
    }
    else if (!/^[A-Za-z0-9]+$/.test(nickname)) {
      notifyError('The nickname can contain only letters and numbers.')
      return;
    }

    setLoading(type);

    let gameId;

    switch (type) {
      case 1: { // Start a new game
        gameId = await createGame(false);
        break;
      }
      case 2: { // Find a game
        gameId = await findGame();
        if (gameId === null) {
          gameId = await createGame(true);
        }
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
      
      if (type === 2) {
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

  const handlePlace = async (number) => {
    await placeCardInGame(game, player, number);
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

        remainingTime = game.data().timerTo - getTimestamp();
        setTimeLeft(remainingTime);

        if (remainingTime <= 0) {
          if (game.data().status === 0) {
            await startGame(game);
          } else if (game.data().status === 1) { // Time left
            await deleteGame(game.id);
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
                      { loading === 1 ? 'Creating new game...' : 'New private game' }
                  </button>
                  <button
                      className={`border-4 border-green-500 bg-green-500 hover:bg-green-600 ${buttonClass}`}
                      onClick={() => handleAction(2)}
                  >
                      { loading === 2 ? 'Finding game...' : 'Enter matchmaking' }
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
                      {loading === 3 ? 'Joining game...' : 'Join public game'}
                    </button>
                  </div>
              </div>
          </div>
        </div>
      ) : null}

      {/* Display when the game is waiting for players */}
      {game?.data().status === 0 ? (
      <div className="space-y-16">
        <h1 className="text-5xl text-center font-black">Waiting for players...</h1>

        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          {game.data().playersSummary.filter((player) => player !== null)
            .map((player, index) => (
              <li key={index} className="text-center">
                <CiUser className="text-6xl p-2 bg-slate-800 rounded-full inline-block" />
                <p className="text-lg mt-2">
                  {player.nickname}
                </p>
              </li>
            ))}
        </ul>

        <div className="flex flex-col items-center space-y-10">
          <button
            className={`border-4 ${game.data().playersSummary[player - 1].ready ? 'border-red-500 bg-red-500 hover:bg-red-600' : 'border-sky-500 bg-sky-500 hover:bg-sky-600'} ${buttonClass}`}
            onClick={() => handleReady()}
          >
            {game.data().playersSummary[player - 1].ready ? 'Unready' : 'Ready'}
          </button>

          <p className="border border-slate-900 py-2 px-4 select-text">Game ID: {game.id}</p>

          <div className="text-5xl flex justify-center items-center space-x-4">
            <GoClock />
            <span className="font-black">{timeLeft > 0 ? timeLeft : 0}</span>
          </div>
        </div>
      </div>
      ) : null}

      {/* Display when the game is in progress or has ended */}
      {game?.data().status > 0 ? (
        <div className="space-y-10">
          <h1 className="text-5xl text-center font-black">Click right time to place.</h1>

          <div className="space-y-3">
          {game.data().playersSummary[player - 1].numbers
            .filter(number => !game.data().places.some(place => place.number === number))
            .map((number, index) => (
              <h3 key={index} className="text-3xl text-sky-500 text-center cursor-pointer" onClick={() => handlePlace(number)}>
                This card's number is {number}.
              </h3>
            ))}
          </div>
          
          {game.data().status === 2 ? (
            <h3
              className="text-3xl text-green-500 text-center"
            >
              You've advanced to the next level (Level {game.data().playersSummary[0].numbers.length + 1}).
            </h3>
          ) : game.data().status === 3 ? (
            <h3
              className="text-3xl text-red-500 text-center"
            >
              You've lost the game.
            </h3>
          ) : null}

          <div className="flex flex-col items-center space-y-10">
            {game.data().places.length > 0 ? (
              <p className="border border-slate-900 py-2 px-4 text-center">
                {game.data().playersSummary[game.data().places[game.data().places.length - 1].player].nickname} ({game.data().places[game.data().places.length - 1].number})
              </p>
            ) : null}

            <div className="text-5xl flex justify-center items-center space-x-4">
              <GoClock />
              <span className="font-black">{timeLeft > 0 ? timeLeft : 0}</span>
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